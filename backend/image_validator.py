import cv2
import numpy as np
from PIL import Image as PILImage


def _skin_mask_from_bgr(img_bgr: np.ndarray) -> np.ndarray:
    """Conservative skin mask used for facial-crop validation."""
    img_ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    ycrcb_mask = cv2.inRange(
        img_ycrcb,
        np.array([0, 133, 77]),
        np.array([255, 173, 127]),
    )
    hsv_mask = cv2.inRange(
        img_hsv,
        np.array([0, 28, 28]),
        np.array([30, 255, 255]),
    )

    skin_mask = cv2.bitwise_and(ycrcb_mask, hsv_mask)
    kernel = np.ones((3, 3), np.uint8)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
    return skin_mask


def is_face_or_cropped_face(image: PILImage.Image) -> bool:
    """
    Allow:
    1) Real human face photos
    2) Tight facial-skin crops (for acne datasets)
    Reject obvious non-human/object/nature images.
    """
    img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]
    total_px = float(h * w)

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")

    # Route 1: direct human face detection.
    frontal_faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=6,
        minSize=(90, 90),
    )
    if len(frontal_faces) > 0:
        return True

    # Side/profile fallback.
    profile_faces = profile_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=6,
        minSize=(90, 90),
    )
    if len(profile_faces) > 0:
        return True

    # Route 2: cropped facial-skin closeups (no full face visible).
    skin_mask = _skin_mask_from_bgr(img_bgr)
    skin_ratio = float(cv2.countNonZero(skin_mask)) / total_px
    if skin_ratio < 0.30:
        return False

    y1, y2 = int(h * 0.20), int(h * 0.80)
    x1, x2 = int(w * 0.20), int(w * 0.80)
    center_skin = skin_mask[y1:y2, x1:x2]
    center_skin_ratio = float(cv2.countNonZero(center_skin)) / float(center_skin.size)
    if center_skin_ratio < 0.38:
        return False

    contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False
    largest_skin_blob = max(cv2.contourArea(c) for c in contours) / total_px
    if largest_skin_blob < 0.18:
        return False

    # Non-skin scenes/animals generally have stronger global edges/textures.
    edges = cv2.Canny(gray, 80, 160)
    edge_ratio = float(cv2.countNonZero(edges)) / total_px
    if edge_ratio > 0.16:
        return False

    # Reject nature-heavy backgrounds.
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    green_mask = cv2.inRange(img_hsv, np.array([35, 40, 30]), np.array([90, 255, 255]))
    green_ratio = float(cv2.countNonZero(green_mask)) / total_px
    if green_ratio > 0.08:
        return False

    blue_mask = cv2.inRange(img_hsv, np.array([90, 40, 30]), np.array([140, 255, 255]))
    blue_ratio = float(cv2.countNonZero(blue_mask)) / total_px
    if blue_ratio > 0.12:
        return False

    return True
