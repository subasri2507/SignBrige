import json
import os
from flask import Blueprint, request, jsonify
from config import Config

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "..", "database", "user_settings.json")

DEFAULT_SETTINGS = {
    "default_spoken_language": "en",
    "selected_sign_language": "ISL",
    "supported_spoken_languages": [
        {"code": "en", "name": "English", "native": "English"},
        {"code": "ta", "name": "Tamil", "native": "தமிழ்"},
        {"code": "hi", "name": "Hindi", "native": "हिन्दी"},
        {"code": "te", "name": "Telugu", "native": "తెలుగు"},
        {"code": "ml", "name": "Malayalam", "native": "മലയാളം"},
        {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ"},
        {"code": "mr", "name": "Marathi", "native": "मराठी"},
        {"code": "bn", "name": "Bengali", "native": "বাংলা"},
        {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી"}
    ],
    "supported_sign_languages": [
        {"code": "ISL", "name": "Indian Sign Language (National ISLRTC)", "region": "All India"},
        {"code": "ISL_SOUTH", "name": "ISL — Southern Regional Dialect", "region": "Chennai / Bengaluru / Hyderabad / Kochi"},
        {"code": "ISL_NORTH", "name": "ISL — Northern/Western Dialect", "region": "Delhi / Mumbai / Kolkata / Ahmedabad"},
        {"code": "ASL", "name": "American Sign Language (ASL Bridge)", "region": "International / North America"},
        {"code": "BSL", "name": "British Sign Language (BSL Bridge)", "region": "UK / Commonwealth"}
    ],
    "fixed_sign_language": {
        "code": "ISL",
        "name": "Indian Sign Language",
        "phase": 1,
        "note": "Primary Sign Language is Indian Sign Language (ISLRTC Standard) with regional ISL dialect & international sign bridge options."
    },
    "tts_speed": 1.0,
    "tts_pitch": 1.0,
    "confidence_threshold_high": 0.75,
    "confidence_threshold_medium": 0.50,
    "camera_resolution": "640x480",
    "microphone_sensitivity": "normal",
    "auto_play_tts": True,
    "app_name": "SignBridge AI",
    "version": "1.2.0"
}

def load_settings():
    res = DEFAULT_SETTINGS.copy()
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                res.update(saved)
                # Always ensure the latest language catalogs are exposed
                res["supported_spoken_languages"] = DEFAULT_SETTINGS["supported_spoken_languages"]
                res["supported_sign_languages"] = DEFAULT_SETTINGS["supported_sign_languages"]
                res["fixed_sign_language"] = DEFAULT_SETTINGS["fixed_sign_language"]
                return res
        except Exception:
            pass
    return res

def save_settings(data):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@settings_bp.route("", methods=["GET"])
def get_settings():
    """GET /api/settings - Returns system settings and config"""
    return jsonify({
        "success": True,
        "settings": load_settings()
    }), 200

@settings_bp.route("", methods=["PUT"])
def update_settings():
    """PUT /api/settings - Update system settings"""
    data = request.get_json(force=True, silent=True) or {}
    current = load_settings()
    
    # Do not allow modifying fixed sign language in Phase 1
    if "fixed_sign_language" in data:
        data.pop("fixed_sign_language")

    current.update(data)
    save_settings(current)

    return jsonify({
        "success": True,
        "message": "Settings updated successfully",
        "settings": current
    }), 200
