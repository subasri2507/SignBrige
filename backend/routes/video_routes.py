from flask import Blueprint, request, jsonify
from utils.landmark_extraction import LandmarkExtractor

video_bp = Blueprint("video", __name__, url_prefix="/api/video")
landmark_extractor = LandmarkExtractor()

@video_bp.route("/extract-landmarks", methods=["POST"])
def extract_landmarks():
    """
    POST /api/video/extract-landmarks
    Extracts MediaPipe hand and pose landmarks from an image frame.
    Body: {"image": "data:image/jpeg;base64,..."}
    """
    data = request.get_json(force=True, silent=True) or {}
    image_b64 = data.get("image", "")

    if not image_b64:
        return jsonify({"success": False, "error": "No 'image' provided in body"}), 400

    extracted = landmark_extractor.extract_from_base64(image_b64)

    has_hands = extracted["left_hand"] is not None or extracted["right_hand"] is not None
    return jsonify({
        "success": True,
        "has_landmarks": has_hands,
        "landmarks": extracted
    }), 200
