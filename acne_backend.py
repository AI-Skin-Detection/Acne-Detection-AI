import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import sys
import os

# Define class names
CLASS_NAMES = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']


def load_model(model_path='acne_model_best.pth'):
    """Load the trained ResNet50 model"""
    
    # Create ResNet50 architecture
    model = models.resnet50(weights=None)

    # Replace final fully connected layer
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, 5)

    # Load weights
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()

    return model


def preprocess_image(image_path):
    """Preprocess image for inference"""

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])

    image = Image.open(image_path)

    if image.mode != 'RGB':
        image = image.convert('RGB')

    image_tensor = transform(image)
    image_tensor = image_tensor.unsqueeze(0)  # Add batch dimension

    return image_tensor


def predict(model, image_tensor):
    """Run prediction"""

    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)

        confidence, predicted_idx = torch.max(probabilities, 1)

        predicted_class = CLASS_NAMES[predicted_idx.item()]
        confidence_score = confidence.item() * 100

        return predicted_class, confidence_score


def main():
    if len(sys.argv) != 2:
        print("Usage: python acne_backend.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found.")
        sys.exit(1)

    print("🔄 Loading model...")
    model = load_model()

    print("🔄 Processing image...")
    image_tensor = preprocess_image(image_path)

    print("🔍 Running prediction...")
    predicted_class, confidence_score = predict(model, image_tensor)

    print("\n===== RESULT =====")
    print(f"Detected Acne Type: {predicted_class}")
    print(f"Confidence Score: {confidence_score:.2f}%")
    print("==================")


if __name__ == "__main__":
    main()