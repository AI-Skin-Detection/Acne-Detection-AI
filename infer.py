from ultralytics import YOLO

model = YOLO("runs/detect/acne_detector/weights/best.pt")

results = model("/media/shoaib/STUDYLINUX/KMIT/2-Year/tp/acne_yolo_pipeline/acne_yolo/2.jpeg", save=True, conf=0.25)