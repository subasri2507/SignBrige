from avatar.animation_mapper import AnimationMapper

class AvatarController:
    """
    Orchestrates avatar animation playback, builds sequential timelines with bundled
    4-stage authored ISLRTC keyframes and GLTF 2.0 clip bindings, and handles transitions.
    """
    def __init__(self):
        self.mapper = AnimationMapper()

    def build_sequence_timeline(self, gloss_sequence):
        """
        Builds a playable timeline for a sequence of ISL glosses.
        """
        if not gloss_sequence:
            return {
                "total_duration": 0.0,
                "timeline": [],
                "unsupported": [],
                "authoring_metadata": self.mapper.authored_metadata
            }

        timeline = []
        unsupported = []
        current_time = 0.0
        transition_pause = 0.25  # smooth transition pause between signs

        for item in gloss_sequence:
            gloss = item.strip().upper()
            anim = self.mapper.get_animation(gloss)

            if anim:
                timeline.append({
                    "gloss": gloss,
                    "animation_id": anim["id"],
                    "display_name": anim["display_name"],
                    "start_time": round(current_time, 2),
                    "duration": anim["duration"],
                    "is_supported": True,
                    "procedural_pose": anim.get("procedural_pose"),
                    "authored_keyframes": anim.get("authored_keyframes", []),
                    "authoring_standard": anim.get("authoring_standard", "ISLRTC-4Stage-Keyframe"),
                    "gltf_asset": anim.get("gltf_asset", "/models/isl_interpreter_avatar.gltf"),
                    "clip_name": anim.get("clip_name"),
                    "description": anim.get("description")
                })
                current_time += anim["duration"] + transition_pause
            else:
                unsupported.append(gloss)
                timeline.append({
                    "gloss": gloss,
                    "animation_id": None,
                    "display_name": gloss,
                    "start_time": round(current_time, 2),
                    "duration": 0.0,
                    "is_supported": False,
                    "procedural_pose": None,
                    "authored_keyframes": [],
                    "clip_name": None,
                    "description": "Animation not available for this gloss"
                })

        return {
            "total_duration": round(current_time, 2),
            "timeline": timeline,
            "unsupported": unsupported,
            "ready_to_play": len(timeline) > 0,
            "authoring_metadata": self.mapper.authored_metadata
        }
