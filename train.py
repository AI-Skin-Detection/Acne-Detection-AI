# STEP 1: Install dependencies
# pip install ultralytics roboflow

from roboflow import Roboflow
from ultralytics import YOLO

# STEP 2: Download dataset from Roboflow
rf = Roboflow(api_key="MGKJm90LDp046IJxEybL")

project = rf.workspace("andrei-dore-5lz05").project("acne04")
dataset = project.version(1).download("yolov8")  # IMPORTANT: yolov8 format

# STEP 3: Load YOLOv8 model (pretrained)
model = YOLO("yolov8m.pt")  # you can also use yolov8s.pt for better accuracy

# STEP 4: Train the model
model.train(
    data=f"{dataset.location}/data.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    name="acne_detector"
)

# STEP 5: Run inference
results = model("test.jpg", show=True)

# STEP 6: Save best model
print("Model saved at:", model.trainer.best)