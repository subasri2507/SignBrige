import os
from flask import Blueprint, request, jsonify
from avatar.animation_mapper import AnimationMapper
from avatar.avatar_controller import AvatarController

avatar_bp = Blueprint("avatar", __name__, url_prefix="/api/avatar")

mapper = AnimationMapper()
controller = AvatarController()

@avatar_bp.route("/animations", methods=["GET"])
def get_avatar_animations():
    """
    GET /api/avatar/animations
    Lists all supported avatar animations, duration, and bundled 4-stage authored keyframes.
    """
    all_anims = mapper.get_all_animations()
    return jsonify({
        "success": True,
        "count": len(all_anims),
        "authoring_metadata": mapper.authored_metadata,
        "animations": all_anims
    }), 200

@avatar_bp.route("/clip/<gloss>", methods=["GET"])
def get_avatar_clip(gloss):
    """
    GET /api/avatar/clip/<gloss>
    Returns the bundled 4-stage authored keyframe clip for a specific ISL gloss.
    """
    anim = mapper.get_animation(gloss)
    if not anim:
        return jsonify({
            "success": False,
            "error": f"No authored clip found for gloss '{gloss}'"
        }), 404
    return jsonify({
        "success": True,
        "clip": anim
    }), 200

@avatar_bp.route("/gltf-info", methods=["GET"])
def get_gltf_info():
    """
    GET /api/avatar/gltf-info
    Returns metadata about the bundled GLTF 2.0 43-joint skeletal rig and 500 authored keyframe tracks.
    """
    gltf_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "models", "isl_interpreter_avatar.gltf")
    )
    gltf_exists = os.path.exists(gltf_path)
    gltf_size_kb = round(os.path.getsize(gltf_path) / 1024, 1) if gltf_exists else 0

    return jsonify({
        "success": True,
        "gltf_asset_url": "/models/isl_interpreter_avatar.gltf",
        "gltf_exists": gltf_exists,
        "gltf_size_kb": gltf_size_kb,
        "rig_joints": 43,
        "embedded_gltf_tracks": 74,
        "bundled_authored_clips": mapper.authored_metadata.get("bundled_clips_count", 500),
        "authoring_standard": "ISLRTC-4Stage-Keyframe (Preparation -> Stroke Onset -> Stroke Hold -> Retraction)"
    }), 200

@avatar_bp.route("/play-sequence", methods=["POST"])
def play_sequence():
    """
    POST /api/avatar/play-sequence
    Generates a timed playback sequence for an array of ISL glosses.
    Body: {"glosses": ["HELLO", "HELP", "WATER"]}
    """
    data = request.get_json(force=True, silent=True) or {}
    glosses = data.get("glosses", [])
    if isinstance(glosses, str):
        glosses = [glosses]

    result = controller.build_sequence_timeline(glosses)
    return jsonify({
        "success": True,
        **result
    }), 200
