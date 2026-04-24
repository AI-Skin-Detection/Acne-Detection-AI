import cv2
import numpy as np
from PIL import Image as PILImage


def _skin_mask_from_bgr(img_bgr: np.ndarray) -> np.ndarray:
    img_ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    ycrcb_mask = cv2.inRange(
        img_ycrcb,
        np.array([0, 133, 77]),
        np.array([255, 173, 127]),
    )
    hsv_mask = cv2.inRange(
        img_hsv,
        np.array([0, 30, 30]),
        np.array([35, 255, 255]),
    )
    return cv2.bitwise_and(ycrcb_mask, hsv_mask)


def is_face_or_cropped_face(image: PILImage.Image) -> bool:
    """
    Allow only:
    1) Full human face images
    2) Cropped facial-skin closeups (acne datasets)
    Reject nature/objects/animals/cartoon-style images.
    """
    img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]

    # Route 1: full face check.
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80),
    )
    if len(faces) > 0:
        return True

    # Route 2: cropped face-skin closeup check.
    skin_mask = _skin_mask_from_bgr(img_bgr)
    skin_ratio = float(cv2.countNonZero(skin_mask)) / float(skin_mask.size)
    if skin_ratio < 0.28:
        return False

    y1, y2 = int(h * 0.2), int(h * 0.8)
    x1, x2 = int(w * 0.2), int(w * 0.8)
    center_skin = skin_mask[y1:y2, x1:x2]
    center_skin_ratio = float(cv2.countNonZero(center_skin)) / float(center_skin.size)
    if center_skin_ratio < 0.30:
        return False

    # One dominant skin blob is expected in real closeup skin crops.
    contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False
    largest_skin_blob = max(cv2.contourArea(c) for c in contours) / float(skin_mask.size)
    if largest_skin_blob < 0.12:
        return False

    # Reject detailed scenes/background-heavy frames.
    edges = cv2.Canny(gray, 80, 160)
    edge_ratio = float(cv2.countNonZero(edges)) / float(edges.size)
    if edge_ratio > 0.20:
        return False

    # Reject greenery-heavy and sky/water-heavy natural scenes.
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    green_mask = cv2.inRange(img_hsv, np.array([35, 40, 30]), np.array([90, 255, 255]))
    green_ratio = float(cv2.countNonZero(green_mask)) / float(green_mask.size)
    if green_ratio > 0.10:
        return False

    blue_mask = cv2.inRange(img_hsv, np.array([90, 40, 30]), np.array([140, 255, 255]))
    blue_ratio = float(cv2.countNonZero(blue_mask)) / float(blue_mask.size)
    if blue_ratio > 0.18:
        return False

    return True
