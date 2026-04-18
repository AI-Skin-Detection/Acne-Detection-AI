from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import os
import base64
from datetime import datetime
from typing import Dict
from pydantic import BaseModel
from torchvision.transforms.functional import to_pil_image
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4

CLASS_NAMES = ["Blackheads", "Cyst", "Papules", "Pustules", "Whiteheads"]

# Resolve model path relative to this file so it works regardless of cwd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "acne_model_best.pth")


def load_model(model_path: str = MODEL_PATH):
    """Load the trained ResNet50 model once at startup."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")

    model = models.resnet50(weights=None)
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, len(CLASS_NAMES))

    state_dict = torch.load(model_path, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()
    return model


# Global model and transform reused across requests
model = load_model()

transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ]
)


def _find_last_conv_layer(m: torch.nn.Module) -> torch.nn.Module:
    last_conv = None
    for layer in m.modules():
        if isinstance(layer, torch.nn.Conv2d):
            last_conv = layer
    if last_conv is None:
        raise RuntimeError("No Conv2d layer found for Grad-CAM")
    return last_conv


def _jet_colormap(x: torch.Tensor) -> torch.Tensor:
    x = x.clamp(0, 1)
    r = (1.5 - (4 * x - 3).abs()).clamp(0, 1)
    g = (1.5 - (4 * x - 2).abs()).clamp(0, 1)
    b = (1.5 - (4 * x - 1).abs()).clamp(0, 1)
    return torch.stack([r, g, b], dim=0)


def _gradcam_overlay_png_data_url(
    *,
    model: torch.nn.Module,
    input_tensor: torch.Tensor,
    input_image_224: Image.Image,
    class_index: int,
    alpha: float = 0.45,
) -> str:
    target_layer = _find_last_conv_layer(model)

    activations: torch.Tensor | None = None
    gradients: torch.Tensor | None = None

    def _forward_hook(_module, _inputs, output):
        nonlocal activations
        activations = output

    def _backward_hook(_module, _grad_input, grad_output):
        nonlocal gradients
        gradients = grad_output[0]

    h1 = target_layer.register_forward_hook(_forward_hook)
    try:
        h2 = target_layer.register_full_backward_hook(_backward_hook)
    except AttributeError:
        h2 = target_layer.register_backward_hook(_backward_hook)

    try:
        model.zero_grad(set_to_none=True)
        logits = model(input_tensor)
        score = logits[0, class_index]
        score.backward(retain_graph=False)

        if activations is None or gradients is None:
            raise RuntimeError("Failed to capture activations/gradients for Grad-CAM")

        acts = activations[0]
        grads = gradients[0]
        weights = grads.mean(dim=(1, 2))
        cam = (weights[:, None, None] * acts).sum(dim=0)
        cam = torch.relu(cam)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)

        cam = torch.nn.functional.interpolate(
            cam[None, None, ...],
            size=(224, 224),
            mode="bilinear",
            align_corners=False,
        )[0, 0]

        heatmap_rgb = _jet_colormap(cam)
        img_tensor = transforms.ToTensor()(input_image_224)
        overlay = ((1 - alpha) * img_tensor + alpha * heatmap_rgb).clamp(0, 1)
        overlay_pil = to_pil_image(overlay)

        buf = io.BytesIO()
        overlay_pil.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64}"
    finally:
        h1.remove()
        h2.remove()


app = FastAPI(title="AI Acne Detection API")

# Enable CORS so the Vite frontend can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Accept an image file and return predicted acne type + confidence."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    image_224 = image.resize((224, 224))
    image_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    all_confidences = {
        CLASS_NAMES[i]: float(probabilities[0, i].item() * 100.0)
        for i in range(len(CLASS_NAMES))
    }

    heatmap = None
    try:
        image_tensor_cam = image_tensor.clone().detach().requires_grad_(True)
        heatmap = _gradcam_overlay_png_data_url(
            model=model,
            input_tensor=image_tensor_cam,
            input_image_224=image_224,
            class_index=int(predicted_idx.item()),
        )
    except Exception:
        heatmap = None

    return {
        "predicted_class": CLASS_NAMES[predicted_idx.item()],
        "confidence": float(confidence.item() * 100.0),
        "confidences": all_confidences,
        "heatmap": heatmap,
    }


class PdfReportRequest(BaseModel):
    prediction: str
    confidence: float
    original_image: str | None = None
    heatmap: str | None = None
    confidences: Dict[str, float] | None = None


def _data_url_to_bytes(data_url: str) -> bytes:
    if not data_url:
        raise ValueError("Missing data URL")

    if "," not in data_url:
        raise ValueError("Invalid data URL format")

    header, b64_data = data_url.split(",", 1)
    if not header.startswith("data:image/"):
        raise ValueError("Only image data URLs are supported")

    return base64.b64decode(b64_data)


def _build_reportlab_image(data_url: str, max_width: float = 260, max_height: float = 260):
    try:
        image_bytes = _data_url_to_bytes(data_url)
        image_stream = io.BytesIO(image_bytes)

        with Image.open(io.BytesIO(image_bytes)) as img_probe:
            width, height = img_probe.size

        if width <= 0 or height <= 0:
            return None

        scale = min(max_width / width, max_height / height, 1.0)
        return RLImage(image_stream, width=width * scale, height=height * scale)
    except Exception:
        return None


@app.post("/generate-pdf")
def generate_pdf(payload: PdfReportRequest):
    if not payload.prediction.strip():
        raise HTTPException(status_code=400, detail="Prediction is required")

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    content = []

    content.append(Paragraph("Acne Detection Report", styles["Title"]))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))
    content.append(Paragraph(f"Detected Acne Type: {payload.prediction}", styles["Normal"]))
    content.append(Paragraph(f"Top Confidence: {payload.confidence:.2f}%", styles["Normal"]))
    content.append(Spacer(1, 12))

    if payload.confidences:
        content.append(Paragraph("Confidence Breakdown", styles["Heading2"]))
        sorted_confidences = sorted(payload.confidences.items(), key=lambda x: x[1], reverse=True)
        for label, score in sorted_confidences:
            content.append(Paragraph(f"- {label}: {score:.2f}%", styles["Normal"]))
        content.append(Spacer(1, 12))

    original_image = _build_reportlab_image(payload.original_image) if payload.original_image else None
    if original_image is not None:
        content.append(Paragraph("Uploaded Image", styles["Heading2"]))
        content.append(Spacer(1, 6))
        content.append(original_image)
        content.append(Spacer(1, 12))

    heatmap_image = _build_reportlab_image(payload.heatmap) if payload.heatmap else None
    if heatmap_image is not None:
        content.append(Paragraph("Grad-CAM Heatmap", styles["Heading2"]))
        content.append(Spacer(1, 6))
        content.append(heatmap_image)
        content.append(Spacer(1, 12))

    content.append(Paragraph("Generated by AI System", styles["Italic"]))

    doc.build(content)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )
