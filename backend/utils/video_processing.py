import base64
import numpy as np

# Safe import for cv2
CV2_AVAILABLE = False
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    pass

def decode_base64_image(base64_string):
    """
    Decodes a base64-encoded image string (with or without data URL prefix)
    into an OpenCV BGR numpy array.
    """
    if not CV2_AVAILABLE:
        return None
    
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
            
        img_bytes = base64.b64decode(base64_string)
        np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[VideoProcessing] Error decoding base64 image: {e}")
        return None

def encode_image_base64(img, format=".jpg"):
    """
    Encodes an OpenCV BGR numpy array into a base64 string.
    """
    if not CV2_AVAILABLE or img is None:
        return ""
    try:
        success, buffer = cv2.imencode(format, img)
        if not success:
            return ""
        return base64.b64encode(buffer).decode("utf-8")
    except Exception as e:
        print(f"[VideoProcessing] Error encoding image: {e}")
        return ""

def resize_frame(frame, width=640, height=480):
    """
    Resizes a frame to standard dimensions for consistent landmark extraction.
    """
    if not CV2_AVAILABLE or frame is None:
        return None
    return cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)
