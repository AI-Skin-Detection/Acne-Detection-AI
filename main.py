from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import os

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

    image_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    return {
        "predicted_class": CLASS_NAMES[predicted_idx.item()],
        "confidence": float(confidence.item() * 100.0),
    }
