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
from PIL import Image as PILImage
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from torchvision import models, transforms
from torchvision.transforms.functional import to_pil_image
from fastapi.responses import FileResponse, StreamingResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, String

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
            created_at TEXT
        )
    """)

    conn.commit()
    conn.close()

init_db()

# ---------------- LOAD MODEL ----------------

CLASS_NAMES = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']

model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, 5)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(os.path.dirname(BASE_DIR), "acne_model_best.pth")
YOLO_MODEL_PATH = os.path.join(BASE_DIR, "best.pt")

model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

yolo_model = YOLO(YOLO_MODEL_PATH)


def _yolo_detections(image: PILImage.Image) -> list[dict[str, object]]:
    detections: list[dict[str, object]] = []

    try:
        print(f"Running YOLO inference on image size: {image.size}")
        results = yolo_model.predict(source=image, verbose=False, conf=0.65, iou=0.4, imgsz=640)

        if not results:
            print("No results returned from YOLO")
            return detections

        result = results[0]
        names = result.names or {}
        img_width, img_height = image.size
        img_area = img_width * img_height

        print(f"Raw YOLO detections: {len(result.boxes)}")

        for box in result.boxes:
            class_id = int(box.cls.item()) if box.cls is not None else -1
            confidence = float(box.conf.item() * 100) if box.conf is not None else 0.0
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Filter: reject boxes that cover >70% of image (likely noise/hallucination)
            box_area = (x2 - x1) * (y2 - y1)
            area_ratio = box_area / img_area if img_area > 0 else 0
            if area_ratio > 0.7:
                print(f"  Filtered: box too large")
                continue

            # NEW: filter very small noise detections
            if area_ratio < 0.001:
                print(f"  Filtered: box too small (noise)")
                continue

            # NEW: filter low confidence noise
            if confidence < 40:
                print(f"  Filtered: low confidence ({confidence:.1f}%)")
                continue

            detection = {
                "class": names.get(class_id, str(class_id)),
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2],
            }
            print(f"Detection: {detection} (area_ratio={area_ratio:.1%})")
            detections.append(detection)

        print(f"Total specific detections: {len(detections)}")
    except Exception as e:
        import traceback
        print(f"YOLO Error: {e}")
        traceback.print_exc()

    return detections


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


def _yolo_annotated_image(image: PILImage.Image, detections: list[dict]) -> str | None:
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

        # Sort by confidence to label only top detections
        sorted_dets = sorted(detections, key=lambda x: x["confidence"], reverse=True)
        top_n = min(3, len(sorted_dets))  # Label only top 3

        for idx, d in enumerate(detections):
            x1, y1, x2, y2 = map(int, d["bbox"])
            cls_name = d["class"]
            conf = d["confidence"] / 100.0
            color = _BOX_COLORS.get(cls_name, _DEFAULT_BOX_COLOR)

            # Draw box border
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, bt)

            # Draw label only for top-3 detections by confidence
            if idx < top_n and conf >= 0.35:
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
        elif not detections:
            cv2.putText(annotated, "No acne detected", (10, int(28 * scale)),
                       _FONT, max(0.5, 0.6 * scale), (0, 255, 0), ft, cv2.LINE_AA)

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
    image = PILImage.open(io.BytesIO(contents))

    if image.mode != "RGB":
        image = image.convert("RGB")

    # Get YOLO detections first
    try:
        detections = _yolo_detections(image)
    except Exception as e:
        print(f"Error getting YOLO detections: {e}")
        detections = []

    # Only classify if acne was detected (avoid hallucination on clear skin)
    if not detections:
        yolo_image = _yolo_annotated_image(image, [])
        return {
            "prediction": "No acne detected",
            "confidence": 0.0,
            "detections": [],
            "yolo_image": yolo_image,
        }

    # Classification only if acne detected
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])

    image_224 = image.resize((224, 224))
    img_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        confidence, idx = torch.max(probs, 1)

    prediction = CLASS_NAMES[idx.item()]
    confidence_score = float(confidence.item() * 100)

    # -------- Improved Severity (YOLO + Confidence) --------
    detection_count = len(detections)

    if detection_count > 0:
        avg_conf = sum([d["confidence"] for d in detections]) / detection_count
    else:
        avg_conf = 0

    severity_score = min(int((detection_count * 15) + (avg_conf * 0.5)), 100)

    if detection_count == 0:
        severity = "No Acne"
        severity_score = 0
    elif severity_score < 30:
        severity = "Mild"
    elif severity_score < 65:
        severity = "Moderate"
    else:
        severity = "Severe"

    # -------- Smart Recommendations (type + severity) --------

    if prediction.lower() == "blackheads":
        if severity == "Mild":
            recommendation = "Use salicylic acid cleanser and exfoliate gently."
        elif severity == "Moderate":
            recommendation = "Use salicylic acid and retinoids regularly."
        else:
            recommendation = "Consult a dermatologist for advanced treatment."

    elif prediction.lower() == "whiteheads":
        if severity == "Mild":
            recommendation = "Use gentle cleanser and avoid oily products."
        elif severity == "Moderate":
            recommendation = "Try benzoyl peroxide or salicylic acid."
        else:
            recommendation = "Consult a dermatologist."

    elif prediction.lower() == "papules":
        if severity == "Mild":
            recommendation = "Avoid touching skin and use anti-inflammatory products."
        elif severity == "Moderate":
            recommendation = "Use benzoyl peroxide and soothing skincare."
        else:
            recommendation = "Seek medical advice."

    elif prediction.lower() == "pustules":
        if severity == "Mild":
            recommendation = "Use antibacterial face wash and avoid picking."
        elif severity == "Moderate":
            recommendation = "Use benzoyl peroxide or topical antibiotics."
        else:
            recommendation = "Consult dermatologist immediately."

    elif prediction.lower() == "cyst":
        recommendation = "Consult a dermatologist. Avoid self-treatment."

    else:
        recommendation = "Maintain proper skincare routine."

    disclaimer = (
        "This system uses AI models for educational purposes only. "
        "Predictions and recommendations may not always be accurate. "
        "Please consult a certified dermatologist for medical advice."
    )

    yolo_image = _yolo_annotated_image(image, detections)

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "INSERT INTO history (user_id, image_name, prediction, created_at) VALUES (?, ?, ?, ?)",
        (
            user_id,
            upload.filename,
            prediction,
            datetime.utcnow().isoformat(timespec="seconds"),
        )
    )

    conn.commit()
    conn.close()

    return {
        "prediction": prediction,
        "confidence": confidence_score,
        "detections": detections,
        "yolo_image": yolo_image,
        "severity": severity,
        "severity_score": severity_score,
        "recommendation": recommendation,
        "disclaimer": disclaimer
    }

# ---------------- HISTORY ----------------

@app.get("/history/{user_id}")
def get_history(user_id: int):

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "SELECT image_name, prediction, created_at FROM history WHERE user_id=? ORDER BY id DESC",
        (user_id,)
    )

    records = c.fetchall()
    conn.close()

    return [
        {
            "image_name": r[0],
            "prediction": r[1],
            "created_at": r[2],
        }
        for r in records
    ]


# ---------------- PDF GENERATION ----------------

class PdfReportRequest(BaseModel):
    prediction: str
    confidence: float
    severity: str | None = None
    severity_score: int | None = None
    original_image: str | None = None

@app.post("/generate-pdf")
def generate_pdf(payload: PdfReportRequest):
    print("PDF API CALLED ✅")

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer)
    styles = getSampleStyleSheet()

    content = []

    # Logo (centered)
    import os
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(BASE_DIR, "logo.png")

    logo = RLImage(logo_path, width=140, height=60)
    content.append(Table([[logo]], hAlign='CENTER'))
    content.append(Spacer(1, 20))

    # Title
    content.append(Paragraph("<b><font color='#22c55e'>DERMA AI ANALYSIS REPORT</font></b>", styles["Title"]))
    content.append(Spacer(1, 8))
    content.append(HRFlowable(width="100%", thickness=1, color="#cccccc"))
    content.append(Spacer(1, 12))
    content.append(Paragraph("AI-Based Acne Detection System", styles["Italic"]))
    content.append(Spacer(1, 20))

    # Summary Section
    content.append(Paragraph("<b>Patient Summary</b>", styles["Heading2"]))
    content.append(Spacer(1, 14))
    content.append(Paragraph(f"🧴 <b>Detected Type:</b> <font color='#22c55e'>{payload.prediction}</font>", styles["Normal"]))
    content.append(Paragraph(f"📊 <b>Confidence:</b> <font color='#22c55e'>{payload.confidence:.2f}%</font>", styles["Normal"]))
    if payload.severity:
        content.append(Paragraph(f"⚠️ <b>Severity:</b> <font color='#facc15'>{payload.severity}</font>", styles["Normal"]))

    content.append(Spacer(1, 16))

    # Detection Stats
    if payload.severity_score is not None:
        content.append(Paragraph("📌 <b>Detection Summary</b>", styles["Heading2"]))
        content.append(Spacer(1, 10))

        if payload.severity_score == 0:
            content.append(Paragraph("No acne detected.", styles["Normal"]))
        else:
            content.append(Paragraph(
                f"Estimated acne severity score: {payload.severity_score}% based on detected regions.",
                styles["Normal"]
            ))

        content.append(Spacer(1, 16))

    # Severity Section
    content.append(Paragraph("<b>Severity Assessment</b>", styles["Heading2"]))
    content.append(Spacer(1, 14))

    if payload.severity:
        content.append(Paragraph(
            f"⚠️ <b>Severity Level:</b> <font color='#22c55e'>{payload.severity}</font>" if payload.severity == "Mild" else
            f"⚠️ <b>Severity Level:</b> <font color='#facc15'>{payload.severity}</font>" if payload.severity == "Moderate" else
            f"⚠️ <b>Severity Level:</b> <font color='#ef4444'>{payload.severity}</font>",
            styles["Normal"]
        ))
    else:
        content.append(Paragraph("Severity information not available.", styles["Normal"]))

    content.append(Spacer(1, 16))

    # Severity Color Bar
    if payload.severity_score is not None:
        bar_width = 400
        bar_height = 15
        score_width = int((payload.severity_score / 100) * bar_width)

        # Choose color based on severity
        if payload.severity == "Severe":
            bar_color = colors.red
        elif payload.severity == "Moderate":
            bar_color = colors.orange
        elif payload.severity == "Mild":
            bar_color = colors.green
        else:
            bar_color = colors.green

        d = Drawing(bar_width, 30)
        d.add(Rect(0, 10, bar_width, bar_height, fillColor=colors.lightgrey, strokeWidth=0))
        d.add(Rect(0, 10, score_width, bar_height, fillColor=bar_color, strokeWidth=0))
        d.add(String(0, 0, f"Severity Score: {payload.severity_score}%", fontSize=10))

        content.append(d)
        content.append(Spacer(1, 20))

    # Recommendation Section
    content.append(Paragraph("💡 <b>Recommendations</b>", styles["Heading2"]))
    content.append(Spacer(1, 14))

    if payload.severity == "No Acne":
        rec = "Maintain a consistent skincare routine and keep your skin clean."
    elif payload.severity == "Mild":
        rec = "Use a gentle cleanser and non-comedogenic products. Avoid oily cosmetics."
    elif payload.severity == "Moderate":
        rec = "Consider salicylic acid or benzoyl peroxide treatments to reduce acne."
    elif payload.severity == "Severe":
        rec = "Consult a dermatologist for proper medical treatment."
    else:
        rec = "Maintain proper skincare routine."

    content.append(Paragraph(f"✔ {rec}", styles["Normal"]))

    content.append(Spacer(1, 20))

    # Disclaimer
    content.append(Paragraph("⚠️ <b>Disclaimer</b>", styles["Heading3"]))
    content.append(Spacer(1, 8))
    content.append(Paragraph(
        "This report is generated using AI and is not a substitute for professional medical advice. Consult a certified dermatologist.",
        styles["Normal"]
    ))

    content.append(Spacer(1, 25))
    content.append(Paragraph("<i>Generated by DERMA AI System</i>", styles["Italic"]))

    doc.build(content)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )