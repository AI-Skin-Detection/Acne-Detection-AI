from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import os
import base64
from torchvision.transforms.functional import to_pil_image

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
        "heatmap": heatmap,
    }
