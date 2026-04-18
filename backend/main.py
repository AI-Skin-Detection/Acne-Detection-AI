import os
import io
import base64
import bcrypt
import sqlite3
from datetime import datetime
import torch
import torch.nn as nn
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from torchvision import models, transforms
from torchvision.transforms.functional import to_pil_image
from fastapi.responses import FileResponse, StreamingResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE ----------------

def init_db():
    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            image_name TEXT,
            prediction TEXT,
            created_at TEXT,
            heatmap TEXT
        )
    """)

    # Backward-compatible migration for existing databases:
    # try to add created_at and heatmap columns if they don't exist yet.
    try:
        c.execute("ALTER TABLE history ADD COLUMN created_at TEXT")
    except sqlite3.OperationalError:
        # Column already exists
        pass

    try:
        c.execute("ALTER TABLE history ADD COLUMN heatmap TEXT")
    except sqlite3.OperationalError:
        # Column already exists
        pass

    conn.commit()
    conn.close()

init_db()

# ---------------- LOAD MODEL ----------------

CLASS_NAMES = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']

model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, 5)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "acne_model_best.pth")
YOLO_MODEL_PATH = os.path.join(BASE_DIR, "best.pt")

model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

yolo_model = YOLO(YOLO_MODEL_PATH)


def _find_last_conv_layer(m: torch.nn.Module) -> torch.nn.Module:
    last_conv = None
    for layer in m.modules():
        if isinstance(layer, torch.nn.Conv2d):
            last_conv = layer
    if last_conv is None:
        raise RuntimeError("No Conv2d layer found for Grad-CAM")
    return last_conv


def _jet_colormap(x: torch.Tensor) -> torch.Tensor:
    """Map a [H,W] tensor in [0,1] to an RGB [3,H,W] tensor in [0,1]."""
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
    """Return a Grad-CAM overlay PNG as a data URL for the provided class_index."""
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

        acts = activations[0]  # [C,h,w]
        grads = gradients[0]   # [C,h,w]
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
        img_tensor = transforms.ToTensor()(input_image_224)  # [3,224,224] in [0,1]

        overlay = ((1 - alpha) * img_tensor + alpha * heatmap_rgb).clamp(0, 1)
        overlay_pil = to_pil_image(overlay)

        buf = io.BytesIO()
        overlay_pil.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64}"
    finally:
        h1.remove()
        h2.remove()


def _yolo_detections(image: Image.Image) -> list[dict[str, object]]:
    detections: list[dict[str, object]] = []

    results = yolo_model.predict(source=image, verbose=False)
    if not results:
        return detections

    result = results[0]
    names = result.names or {}

    for box in result.boxes:
        class_id = int(box.cls.item()) if box.cls is not None else -1
        confidence = float(box.conf.item() * 100) if box.conf is not None else 0.0
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        detections.append(
            {
                "class": names.get(class_id, str(class_id)),
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2],
            }
        )

    return detections

# ---------------- SIGNUP ----------------

@app.post("/signup")
def signup(email: str = Form(...), password: str = Form(...)):
    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        c.execute(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            (email, hashed_password)
        )
        conn.commit()
        return {"message": "User created successfully"}
    except:
        return {"error": "User already exists"}
    finally:
        conn.close()

# ---------------- LOGIN ----------------

@app.post("/login")
def login(email: str = Form(...), password: str = Form(...)):
    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute("SELECT id, password FROM users WHERE email=?", (email,))
    user = c.fetchone()
    conn.close()

    if not user:
        return {"error": "Invalid email"}

    user_id, stored_password = user

    if not bcrypt.checkpw(password.encode(), stored_password.encode()):
        return {"error": "Wrong password"}

    return {"user_id": user_id}

# ---------------- PREDICT ----------------

@app.post("/predict")
async def predict(
    user_id: str = Form(...),
    file: UploadFile | None = File(None),
    image: UploadFile | None = File(None)
):

    # Convert user_id safely
    try:
        user_id = int(user_id)
    except Exception:
        return {"error": "Invalid user_id"}

    upload = file if file is not None else image

    if upload is None:
        return {"error": "No image uploaded"}

    contents = await upload.read()
    image = Image.open(io.BytesIO(contents))

    if image.mode != "RGB":
        image = image.convert("RGB")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])

    image_224 = image.resize((224, 224))
    img_tensor = transform(image).unsqueeze(0)

    # Prediction (no gradients needed)
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        confidence, idx = torch.max(probs, 1)

    prediction = CLASS_NAMES[idx.item()]
    confidence_score = float(confidence.item() * 100)

    # Grad-CAM heatmap overlay for the predicted class
    heatmap = None
    try:
        img_tensor_cam = img_tensor.clone().detach().requires_grad_(True)
        heatmap = _gradcam_overlay_png_data_url(
            model=model,
            input_tensor=img_tensor_cam,
            input_image_224=image_224,
            class_index=int(idx.item()),
        )
    except Exception:
        heatmap = None

    try:
        detections = _yolo_detections(image)
    except Exception:
        detections = []

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "INSERT INTO history (user_id, image_name, prediction, created_at, heatmap) VALUES (?, ?, ?, ?, ?)",
        (
            user_id,
            upload.filename,
            prediction,
            datetime.utcnow().isoformat(timespec="seconds"),
            heatmap,
        )
    )

    conn.commit()
    conn.close()

    return {
        "prediction": prediction,
        "confidence": confidence_score,
        "heatmap": heatmap,
        "detections": detections,
    }

# ---------------- HISTORY ----------------

@app.get("/history/{user_id}")
def get_history(user_id: int):

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "SELECT image_name, prediction, created_at, heatmap FROM history WHERE user_id=? ORDER BY id DESC",
        (user_id,)
    )

    records = c.fetchall()
    conn.close()

    return [
        {
            "image_name": r[0],
            "prediction": r[1],
            "created_at": r[2],
            "heatmap": r[3],
        }
        for r in records
    ]


# ---------------- PDF GENERATION ----------------

class PdfReportRequest(BaseModel):
    prediction: str
    confidence: float
    original_image: str | None = None
    heatmap: str | None = None
    confidences: dict | None = None

@app.post("/generate-pdf")
def generate_pdf(payload: PdfReportRequest):
    print("PDF API CALLED ✅")

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer)
    styles = getSampleStyleSheet()

    content = []

    content.append(Paragraph("Acne Detection Report", styles["Title"]))
    content.append(Spacer(1, 20))

    content.append(Paragraph("Name: User", styles["Normal"]))
    content.append(Paragraph(f"Detected Acne Type: {payload.prediction}", styles["Normal"]))
    content.append(Paragraph(f"Confidence: {payload.confidence:.2f}%", styles["Normal"]))

    if payload.confidences:
        content.append(Spacer(1, 12))
        content.append(Paragraph("Confidence Breakdown:", styles["Heading2"]))
        sorted_confidences = sorted(payload.confidences.items(), key=lambda x: x[1], reverse=True)
        for label, score in sorted_confidences:
            content.append(Paragraph(f"- {label}: {score:.2f}%", styles["Normal"]))

    content.append(Spacer(1, 20))
    content.append(Paragraph("Generated by AI System", styles["Italic"]))

    doc.build(content)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )