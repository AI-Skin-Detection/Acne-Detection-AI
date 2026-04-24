import os
import io
import base64
import bcrypt
import sqlite3
from collections import Counter
from datetime import datetime
import cv2
import numpy as np
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
            yolo_image TEXT
        )
    """)

    try:
        c.execute("ALTER TABLE history ADD COLUMN yolo_image TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()

init_db()

# ---------------- LOAD MODEL ----------------

CLASS_NAMES = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.25"))
YOLO_MAX_DETECTIONS = int(os.getenv("YOLO_MAX_DETECTIONS", "10"))
YOLO_CONFIDENCE_FALLBACKS = [
    float(value.strip())
    for value in os.getenv("YOLO_CONFIDENCE_FALLBACKS", "0.25,0.10,0.05,0.01").split(",")
    if value.strip()
]

model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, 5)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "acne_model_best.pth")
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", os.path.join(BASE_DIR, "last.pt"))

model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

yolo_model = None
yolo_status = "not_configured"
yolo_load_error = None

if os.path.exists(YOLO_MODEL_PATH):
    try:
        yolo_model = YOLO(YOLO_MODEL_PATH)
        yolo_status = "loaded"
    except Exception as e:
        yolo_status = "load_failed"
        yolo_load_error = str(e)
else:
    yolo_load_error = f"YOLO model file not found: {YOLO_MODEL_PATH}"

resnet_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])


def _classify_region(image: Image.Image) -> tuple[str, float]:
    img_tensor = resnet_transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        confidence, idx = torch.max(probs, 1)

    return CLASS_NAMES[idx.item()], float(confidence.item() * 100)


def _yolo_detections(image: Image.Image) -> tuple[list[dict[str, object]], float | None]:
    detections: list[dict[str, object]] = []

    if yolo_model is None:
        print(f"YOLO unavailable: {yolo_load_error}")
        return detections, None

    try:
        print(f"Running YOLO inference on image size: {image.size}")
        thresholds = []
        for threshold in [YOLO_CONFIDENCE, *YOLO_CONFIDENCE_FALLBACKS]:
            if threshold not in thresholds:
                thresholds.append(threshold)

        used_confidence = None
        result = None

        for threshold in thresholds:
            results = yolo_model.predict(
                source=image,
                verbose=False,
                conf=threshold,
                iou=0.45,
                imgsz=640,
                max_det=YOLO_MAX_DETECTIONS,
            )

            if not results:
                print(f"No results returned from YOLO at conf={threshold}")
                continue

            result = results[0]
            raw_count = len(result.boxes)
            print(f"Raw YOLO detections at conf={threshold}: {raw_count}")

            if raw_count > 0:
                used_confidence = threshold
                break

        if result is None or used_confidence is None:
            return detections, None

        img_width, img_height = image.size
        img_area = img_width * img_height

        for box in result.boxes:
            class_id = int(box.cls.item()) if box.cls is not None else -1
            confidence = float(box.conf.item() * 100) if box.conf is not None else 0.0
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Filter: reject boxes that cover >60% of image (likely noise/hallucination)
            box_area = (x2 - x1) * (y2 - y1)
            area_ratio = box_area / img_area if img_area > 0 else 0
            if area_ratio > 0.6:
                print(f"  Filtered: box area ratio {area_ratio:.1%} too large (>60%)")
                continue

            crop_box = (
                max(0, int(round(x1))),
                max(0, int(round(y1))),
                min(img_width, int(round(x2))),
                min(img_height, int(round(y2))),
            )

            if crop_box[2] <= crop_box[0] or crop_box[3] <= crop_box[1]:
                print(f"  Filtered: invalid box {crop_box}")
                continue

            crop = image.crop(crop_box)
            resnet_class, resnet_confidence = _classify_region(crop)

            detection = {
                "class": resnet_class,
                "confidence": resnet_confidence,
                "bbox": list(crop_box),
                "detector_class": class_id,
                "detector_confidence": confidence,
            }
            print(f"Detection: {detection} (area_ratio={area_ratio:.1%})")
            detections.append(detection)

        print(f"Total specific detections: {len(detections)}")
        return detections, used_confidence
    except Exception as e:
        import traceback
        print(f"YOLO Error: {e}")
        traceback.print_exc()

    return detections, None


_BOX_COLORS = {
    "Blackheads": (0, 200, 0),
    "Cyst":       (0, 255, 100),
    "Papules":    (0, 230, 50),
    "Pustules":   (50, 255, 50),
    "Whiteheads": (0, 180, 80),
}
_DEFAULT_BOX_COLOR = (0, 255, 0)
_FONT      = cv2.FONT_HERSHEY_SIMPLEX
_FONT_S    = 0.55
_FONT_T    = 1
_BOX_T     = 2


def _yolo_annotated_image(image: Image.Image, detections: list[dict]) -> str | None:
    """Draw green bounding boxes on image, return as base64 PNG data URL."""
    try:
        img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        annotated = img_bgr.copy()
        h, w = annotated.shape[:2]

        # Scale font/thickness relative to image size
        scale = max(w, h) / 640.0
        fs = np.clip(0.4 * scale, 0.3, 0.8)
        ft = np.clip(int(1.5 * scale), 1, 2)
        bt = np.clip(int(2 * scale), 1, 3)

        # Label only the top 3 regions by ResNet confidence.
        sorted_dets = sorted(
            enumerate(detections),
            key=lambda item: item[1]["confidence"],
            reverse=True,
        )
        top_label_indexes = {idx for idx, _ in sorted_dets[:3]}

        for idx, d in enumerate(detections):
            x1, y1, x2, y2 = map(int, d["bbox"])
            cls_name = d["class"]
            conf = d["confidence"] / 100.0
            color = _BOX_COLORS.get(cls_name, _DEFAULT_BOX_COLOR)

            # Draw box border
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, bt)

            if idx in top_label_indexes and conf >= 0.35:
                label = f"{cls_name} {conf:.0%}"
                (tw, th), baseline = cv2.getTextSize(label, _FONT, fs, ft)
                label_y = max(y1 - 4, th + 4)
                cv2.rectangle(annotated, (x1, label_y - th - 3),
                             (x1 + tw + 4, label_y + baseline), color, cv2.FILLED)
                cv2.putText(annotated, label, (x1 + 2, label_y - 2),
                           _FONT, fs, (255, 255, 255), ft, cv2.LINE_AA)

        # Summary only if <= 10 detections
        if detections and len(detections) <= 10:
            counts = Counter(d["class"] for d in detections)
            pad, dy = int(10 * scale), int(20 * scale)
            y = pad + dy
            summary_text = f"Acne: {len(detections)}"
            cv2.putText(annotated, summary_text, (pad, y),
                        _FONT, max(0.4, 0.5 * scale), (0, 255, 0), ft, cv2.LINE_AA)
            y += dy
            for cls_name, cnt in list(counts.items())[:3]:  # Top 3 classes only
                color = _BOX_COLORS.get(cls_name, _DEFAULT_BOX_COLOR)
                cv2.putText(annotated, f"{cls_name}: {cnt}", (pad, y),
                           _FONT, max(0.35, 0.4 * scale), color, ft, cv2.LINE_AA)
                y += dy
        _, buf = cv2.imencode(".png", annotated)
        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        return f"data:image/png;base64,{b64}"
    except Exception as e:
        print(f"Error in _yolo_annotated_image: {e}")
        return None


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

    if yolo_model is None:
        return {
            "error": "YOLO detector model is not available. Add last.pt to the project root or set YOLO_MODEL_PATH.",
            "prediction": "Detector unavailable",
            "confidence": 0.0,
            "detections": [],
            "yolo_image": None,
            "yolo_status": yolo_status,
            "yolo_error": yolo_load_error,
        }

    # Get YOLO detections first
    try:
        detections, used_yolo_confidence = _yolo_detections(image)
    except Exception as e:
        print(f"Error getting YOLO detections: {e}")
        detections = []
        used_yolo_confidence = None

    # Only classify if acne was detected (avoid hallucination on clear skin)
    if not detections:
        yolo_image = _yolo_annotated_image(image, [])
        return {
            "prediction": "No YOLO regions detected",
            "confidence": 0.0,
            "detections": [],
            "yolo_image": yolo_image,
            "yolo_status": yolo_status,
            "used_yolo_confidence": used_yolo_confidence,
            "message": "YOLO returned no boxes, so ResNet was not run on any crop.",
        }

    counts = Counter(d["class"] for d in detections)
    prediction = counts.most_common(1)[0][0]
    matching_confidences = [
        float(d["confidence"]) for d in detections if d["class"] == prediction
    ]
    confidence_score = sum(matching_confidences) / len(matching_confidences)

    yolo_image = _yolo_annotated_image(image, detections)

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "INSERT INTO history (user_id, image_name, prediction, created_at, yolo_image) VALUES (?, ?, ?, ?, ?)",
        (
            user_id,
            upload.filename,
            prediction,
            datetime.utcnow().isoformat(timespec="seconds"),
            yolo_image,
        )
    )

    conn.commit()
    conn.close()

    return {
        "prediction": prediction,
        "confidence": confidence_score,
        "detections": detections,
        "yolo_image": yolo_image,
        "yolo_status": yolo_status,
        "used_yolo_confidence": used_yolo_confidence,
        "message": "YOLO detected regions; ResNet classified each cropped region.",
    }

# ---------------- HISTORY ----------------

@app.get("/history/{user_id}")
def get_history(user_id: int):

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "SELECT image_name, prediction, created_at, yolo_image FROM history WHERE user_id=? ORDER BY id DESC",
        (user_id,)
    )

    records = c.fetchall()
    conn.close()

    return [
        {
            "image_name": r[0],
            "prediction": r[1],
            "created_at": r[2],
            "yolo_image": r[3],
            "heatmap": r[3],
        }
        for r in records
    ]


# ---------------- PDF GENERATION ----------------

class PdfReportRequest(BaseModel):
    prediction: str
    confidence: float
    original_image: str | None = None

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

    content.append(Spacer(1, 20))
    content.append(Paragraph("Generated by AI System", styles["Italic"]))

    doc.build(content)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )
