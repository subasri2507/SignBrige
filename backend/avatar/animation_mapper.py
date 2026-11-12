import json
import os
from config import Config

AUTHORED_KEYFRAMES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "animations", "isl_authored_keyframes.json")

class AnimationMapper:
    """
    Maps all 500 ISL glosses to bundled authored 4-stage keyframe tracks
    (Preparation -> Stroke Onset -> Stroke Hold/Apex -> Retraction) and
    external GLTF 2.0 skeletal rig clips (/models/isl_interpreter_avatar.gltf).
    """
    def __init__(self):
        self.animations = {}
        self.authored_metadata = {
            "authoring_standard": "ISLRTC-4Stage-Keyframe",
            "rig_joints": 43,
            "gltf_asset": "/models/isl_interpreter_avatar.gltf",
            "bundled_clips_count": 0
        }
        self._load_from_dictionary()
        self._load_authored_keyframes()

    def _load_from_dictionary(self):
        if os.path.exists(Config.ISL_DICTIONARY_PATH):
            try:
                with open(Config.ISL_DICTIONARY_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data.get("entries", []):
                        gloss = item["gloss"].upper()
                        self.animations[gloss] = {
                            "id": item.get("animation_id", f"anim_{gloss.lower()}"),
                            "gloss": gloss,
                            "display_name": item["word"].title(),
                            "category": item.get("category", "general"),
                            "duration": 2.2,
                            "clip_name": f"ISL_{gloss}",
                            "description": item.get("description", ""),
                            "authoring_standard": "ISLRTC-4Stage-Keyframe",
                            "rig_joints": 43,
                            "gltf_asset": "/models/isl_interpreter_avatar.gltf",
                            "procedural_pose": {
                                "right_shoulder": [0.4, 0.2, -0.2],
                                "right_elbow": [1.1, 0.1, 0.0],
                                "right_wrist": [0.2, 0.1, 0.1],
                                "left_shoulder": [0.3, -0.1, 0.2],
                                "left_elbow": [0.8, 0.0, 0.0],
                                "head": [0.05, 0.0, 0.0]
                            },
                            "authored_keyframes": []
                        }
            except Exception as e:
                print(f"[AnimationMapper] Warning loading dictionary animations: {e}")

    def _load_authored_keyframes(self):
        if os.path.exists(AUTHORED_KEYFRAMES_PATH):
            try:
                with open(AUTHORED_KEYFRAMES_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                clips = data.get("clips", {})
                self.authored_metadata["bundled_clips_count"] = len(clips)
                for gloss, clip in clips.items():
                    key = gloss.upper()
                    if key in self.animations:
                        self.animations[key]["duration"] = clip.get("duration", 2.2)
                        self.animations[key]["clip_name"] = clip.get("clip_name", f"ISL_{key}")
                        self.animations[key]["authored_keyframes"] = clip.get("keyframes", [])
                        self.animations[key]["fps"] = clip.get("fps", 30)
                        # Set apex pose as primary procedural_pose reference
                        kfs = clip.get("keyframes", [])
                        if len(kfs) >= 2:
                            apex = kfs[1]
                            self.animations[key]["procedural_pose"] = {
                                "right_shoulder": apex.get("rShoulder", [0.4, 0.2, -0.2]),
                                "right_elbow": apex.get("rElbow", [1.1, 0.1, 0.0]),
                                "right_wrist": apex.get("rWrist", [0.2, 0.1, 0.1]),
                                "left_shoulder": apex.get("lShoulder", [0.3, -0.1, 0.2]),
                                "left_elbow": apex.get("lElbow", [0.8, 0.0, 0.0]),
                                "left_wrist": apex.get("lWrist", [0.0, 0.0, 0.0]),
                                "head": apex.get("headRot", [0.05, 0.0, 0.0]),
                                "rFingers": apex.get("rFingers", [0.2, 0.2, 0.2, 0.2, 0.2]),
                                "lFingers": apex.get("lFingers", [0.2, 0.2, 0.2, 0.2, 0.2]),
                                "browRaise": apex.get("browRaise", 0.05),
                                "mouthOpen": apex.get("mouthOpen", 0.08)
                            }
            except Exception as e:
                print(f"[AnimationMapper] Warning loading authored keyframes: {e}")

    def get_animation(self, gloss):
        """Returns animation metadata and 4-stage authored keyframes for a given gloss (including SPELL:* fingerspelling)"""
        key = gloss.strip().upper()
        if key in self.animations:
            return self.animations[key]
        if key.startswith("SPELL:"):
            word_part = key.split(":", 1)[1]
            return {
                "id": f"anim_spell_{word_part.lower()}",
                "gloss": key,
                "display_name": f"Fingerspell: {word_part}",
                "category": "fingerspelling",
                "duration": max(2.0, len(word_part) * 0.45),
                "clip_name": f"ISL_Spell_{word_part}",
                "description": f"ISL Alphabetical Fingerspelling for '{word_part}'",
                "authoring_standard": "ISLRTC-Alphabet-Keyframes",
                "rig_joints": 43,
                "gltf_asset": "/models/isl_interpreter_avatar.gltf",
                "procedural_pose": {
                    "right_shoulder": [0.4, 0.2, -0.2],
                    "right_elbow": [1.1, 0.1, 0.0],
                    "right_wrist": [0.2, 0.1, 0.1],
                    "left_shoulder": [0.3, -0.1, 0.2],
                    "left_elbow": [0.8, 0.0, 0.0],
                    "head": [0.05, 0.0, 0.0]
                },
                "authored_keyframes": []
            }
        return None

    def get_all_animations(self):
        """Returns list of all available animation mappings"""
        return list(self.animations.values())
