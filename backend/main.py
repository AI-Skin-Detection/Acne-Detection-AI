import os
import io
import bcrypt
import sqlite3
import torch
import torch.nn as nn
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from torchvision import models, transforms

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
            prediction TEXT
        )
    """)

    conn.commit()
    conn.close()

init_db()

# ---------------- LOAD MODEL ----------------

CLASS_NAMES = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']

model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, 5)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "acne_model_best.pth")

model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

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

    img_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        confidence, idx = torch.max(probs, 1)

    prediction = CLASS_NAMES[idx.item()]
    confidence_score = float(confidence.item() * 100)

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "INSERT INTO history (user_id, image_name, prediction) VALUES (?, ?, ?)",
        (user_id, upload.filename, prediction)
    )

    conn.commit()
    conn.close()

    return {
        "prediction": prediction,
        "confidence": confidence_score
    }

# ---------------- HISTORY ----------------

@app.get("/history/{user_id}")
def get_history(user_id: int):

    conn = sqlite3.connect("dermai.db")
    c = conn.cursor()

    c.execute(
        "SELECT image_name, prediction FROM history WHERE user_id=?",
        (user_id,)
    )

    records = c.fetchall()
    conn.close()

    return [
        {"image_name": r[0], "prediction": r[1]}
        for r in records
    ]