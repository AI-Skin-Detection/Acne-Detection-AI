"""Quick test of YOLO detection on different images."""
from pathlib import Path

from backend.main import _yolo_detections, yolo_load_error, yolo_status
from PIL import Image

BASE_DIR = Path(__file__).resolve().parents[1]

# Test on a few images
test_images = [
    BASE_DIR / 'test_images' / 'blackhead_image.png',
    BASE_DIR / 'test_images' / 'Pustules_image.png',
]

print(f"YOLO status: {yolo_status}")
if yolo_load_error:
    print(f"YOLO load error: {yolo_load_error}")

for img_path in test_images:
    try:
        img = Image.open(img_path).convert('RGB')
        print(f"\n{'='*60}")
        print(f"Testing: {img_path} (size: {img.size})")
        print('='*60)
        dets, used_conf = _yolo_detections(img)
        print(f"Result: {len(dets)} detections at conf={used_conf}\n")
    except Exception as e:
        print(f"Error: {e}\n")
