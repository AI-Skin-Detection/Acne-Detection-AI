"""Quick test of YOLO detection on different images."""
import sys
sys.path.insert(0, '.')

from main import _yolo_detections
from PIL import Image

# Test on a few images
test_images = [
    '../test_images/blackhead_image.png',
    '../test_images/cyst_image.png',
    '../test_images/pustule_image.png',
]

for img_path in test_images:
    try:
        img = Image.open(img_path).convert('RGB')
        print(f"\n{'='*60}")
        print(f"Testing: {img_path} (size: {img.size})")
        print('='*60)
        dets = _yolo_detections(img)
        print(f"✓ Result: {len(dets)} detections\n")
    except Exception as e:
        print(f"✗ Error: {e}\n")
