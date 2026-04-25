from ultralytics import YOLO
from pathlib import Path

base_dir = Path(__file__).resolve().parent
model_path = base_dir / "last.pt"
image_path = base_dir / "test_images" / "blackhead_image.png"

if not model_path.exists():
    raise FileNotFoundError(f"YOLO model not found: {model_path}")

model = YOLO(model_path)

for conf in (0.25, 0.10, 0.05, 0.01):
    print(f"\n=== Testing YOLO at conf={conf} ===")
    results = model(str(image_path), save=True, conf=conf, max_det=10)
    result = results[0]
    print(f"classes: {result.names}")
    print(f"boxes: {len(result.boxes)}")

    for index, box in enumerate(result.boxes[:10]):
        cls_id = int(box.cls.item()) if box.cls is not None else -1
        detector_conf = float(box.conf.item() * 100) if box.conf is not None else 0.0
        bbox = [round(v, 2) for v in box.xyxy[0].tolist()]
        print(
            f"{index + 1}. class={result.names.get(cls_id, cls_id)} "
            f"conf={detector_conf:.2f}% bbox={bbox}"
        )
