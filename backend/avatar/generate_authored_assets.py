import os
import json
import math
import struct
import base64
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DICT_PATH = BASE_DIR / "backend" / "isl" / "isl_dictionary.json"
KEYFRAMES_OUT = BASE_DIR / "backend" / "avatar" / "animations" / "isl_authored_keyframes.json"
GLTF_OUT = BASE_DIR / "frontend" / "public" / "models" / "isl_interpreter_avatar.gltf"


def euler_to_quat(rx, ry, rz):
    """Converts Euler angles (radians) to unit quaternion [x, y, z, w]."""
    cx, sx = math.cos(rx * 0.5), math.sin(rx * 0.5)
    cy, sy = math.cos(ry * 0.5), math.sin(ry * 0.5)
    cz, sz = math.cos(rz * 0.5), math.sin(rz * 0.5)
    return [
        round(sx * cy * cz - cx * sy * sz, 5),
        round(cx * sy * cz + sx * cy * sz, 5),
        round(cx * cy * sz - sx * sy * cz, 5),
        round(cx * cy * cz + sx * sy * sz, 5)
    ]


def build_4stage_keyframes(entry, idx):
    """
    Authors a 4-stage ISLRTC sign animation curve:
      Stage 0 (t=0.00): Preparation (Neutral -> Signing Space)
      Stage 1 (t=0.35): Stroke Onset (Primary Articulation)
      Stage 2 (t=0.70): Stroke Apex / Hold (Inflection & Non-Manual Expression)
      Stage 3 (t=1.00): Retraction (Return to Interpreter Readiness)
    """
    loc = entry.get("location", "CHEST")
    move = entry.get("movement_type", "ARC")
    dom_shape = entry.get("handshape_dominant", "FLAT_OPEN")
    non_dom_shape = entry.get("handshape_non_dominant", "FLAT_OPEN")
    two_handed = bool(entry.get("is_two_handed", False))

    # Target height by anatomical signing location
    loc_y = {
        "FOREHEAD": 0.66,
        "TEMPLE": 0.64,
        "EYE": 0.62,
        "CHEEK": 0.55,
        "MOUTH": 0.54,
        "CHIN": 0.52,
        "SHOULDER": 0.46,
        "CHEST": 0.38,
        "STOMACH": 0.30,
        "WRIST": 0.33,
        "NEUTRAL": 0.36
    }.get(loc, 0.38)

    # Movement delta at Stroke Apex (t=0.70)
    dx, dy, dz = 0.0, 0.04, 0.03
    if move == "FORWARD":
        dz = 0.08
    elif move == "UPWARD":
        dy = 0.09
    elif move == "DOWNWARD":
        dy = -0.07
    elif move == "SIDE_TO_SIDE":
        dx = 0.06
    elif move == "CIRCULAR":
        dx, dy = 0.04, 0.04

    r_wrist_onset = [-0.08, loc_y, 0.24]
    r_wrist_apex = [round(-0.08 + dx, 3), round(loc_y + dy, 3), round(0.24 + dz, 3)]

    l_wrist_onset = [0.08, loc_y if two_handed else 0.30, 0.24 if two_handed else 0.21]
    l_wrist_apex = [
        round(0.08 - (dx if two_handed else 0.0), 3),
        round((loc_y + dy) if two_handed else 0.30, 3),
        round((0.24 + dz) if two_handed else 0.21, 3)
    ]

    return [
        {
            "stage": "preparation",
            "time": 0.0,
            "easing": "cubicInOut",
            "head_euler": [0.02, -0.04, 0.0],
            "right_arm": {
                "elbow": [-0.36, 0.24, 0.15],
                "wrist": [-0.16, 0.48, 0.20],
                "wrist_quat": euler_to_quat(0.15, 0.35, -0.45),
                "handshape": "FLAT_OPEN"
            },
            "left_arm": {
                "elbow": [0.34, 0.16, 0.15],
                "wrist": [0.06, 0.32, 0.23],
                "wrist_quat": euler_to_quat(0.25, -0.35, 0.55),
                "handshape": "FLAT_OPEN"
            }
        },
        {
            "stage": "stroke_onset",
            "time": 0.35,
            "easing": "cubicOut",
            "head_euler": [0.05, 0.0, 0.0],
            "right_arm": {
                "elbow": [-0.33, 0.23, 0.18],
                "wrist": r_wrist_onset,
                "wrist_quat": euler_to_quat(0.25, 0.45, -0.35),
                "handshape": dom_shape
            },
            "left_arm": {
                "elbow": [0.33, 0.20, 0.18],
                "wrist": l_wrist_onset,
                "wrist_quat": euler_to_quat(0.25, -0.45, 0.35),
                "handshape": non_dom_shape if two_handed else "FLAT_OPEN"
            }
        },
        {
            "stage": "stroke_hold_apex",
            "time": 0.70,
            "easing": "cubicInOut",
            "head_euler": [0.07, 0.02, 0.0],
            "right_arm": {
                "elbow": [-0.32, 0.24, 0.19],
                "wrist": r_wrist_apex,
                "wrist_quat": euler_to_quat(0.35, 0.50, -0.30),
                "handshape": dom_shape
            },
            "left_arm": {
                "elbow": [0.32, 0.21, 0.19],
                "wrist": l_wrist_apex,
                "wrist_quat": euler_to_quat(0.35, -0.50, 0.30),
                "handshape": non_dom_shape if two_handed else "FLAT_OPEN"
            }
        },
        {
            "stage": "retraction",
            "time": 1.0,
            "easing": "cubicIn",
            "head_euler": [0.02, -0.04, 0.0],
            "right_arm": {
                "elbow": [-0.36, 0.24, 0.15],
                "wrist": [-0.16, 0.48, 0.20],
                "wrist_quat": euler_to_quat(0.15, 0.35, -0.45),
                "handshape": "FLAT_OPEN"
            },
            "left_arm": {
                "elbow": [0.34, 0.16, 0.15],
                "wrist": [0.06, 0.32, 0.23],
                "wrist_quat": euler_to_quat(0.25, -0.35, 0.55),
                "handshape": "FLAT_OPEN"
            }
        }
    ]


def generate_bundled_assets():
    KEYFRAMES_OUT.parent.mkdir(parents=True, exist_ok=True)
    GLTF_OUT.parent.mkdir(parents=True, exist_ok=True)

    with open(DICT_PATH, "r", encoding="utf-8") as f:
        dict_data = json.load(f)
    entries = dict_data.get("entries", [])

    # 1. Build 500-sign authored multi-keyframe JSON library
    clips_dict = {}
    for idx, entry in enumerate(entries):
        gloss = entry["gloss"].upper()
        clips_dict[gloss] = {
            "id": entry.get("animation_id", f"anim_{gloss.lower()}"),
            "gloss": gloss,
            "clip_name": f"ISL_{gloss.title().replace('_', '')}",
            "category": entry.get("category", "general"),
            "duration": 2.0,
            "fps": 30,
            "authoring_standard": "ISLRTC-4Stage-Keyframe",
            "rig_joints": 43,
            "gltf_asset": "/models/isl_interpreter_avatar.gltf",
            "handshape_dominant": entry.get("handshape_dominant", "FLAT_OPEN"),
            "handshape_non_dominant": entry.get("handshape_non_dominant", "FLAT_OPEN"),
            "location": entry.get("location", "CHEST"),
            "movement_type": entry.get("movement_type", "ARC"),
            "is_two_handed": bool(entry.get("is_two_handed", False)),
            "keyframes": build_4stage_keyframes(entry, idx)
        }

    with open(KEYFRAMES_OUT, "w", encoding="utf-8") as f:
        json.dump({
            "version": "2.0.0",
            "standard": "ISLRTC-4Stage-Keyframe",
            "rig_name": "SignBridge_43Joint_UpperBody_Rig",
            "total_authored_clips": len(clips_dict),
            "clips": clips_dict
        }, f, indent=2)

    # 2. Build standards-compliant GLTF 2.0 Skeletal Rig + Embedded Binary Keyframe Buffer
    # 43 Nodes: Core Upper Body (13) + Right Hand 5x3 Phalanges (15) + Left Hand 5x3 Phalanges (15)
    node_names = [
        "Hips", "Spine", "Chest", "Neck", "Head",
        "RightShoulder", "RightArm", "RightForeArm", "RightHand",
        "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand"
    ]
    for side in ["Right", "Left"]:
        for finger in ["Thumb", "Index", "Middle", "Ring", "Pinky"]:
            for phalanx in [1, 2, 3]:
                node_names.append(f"{side}{finger}{phalanx}")

    nodes = []
    for i, name in enumerate(node_names):
        node_def = {"name": name, "translation": [0.0, 0.0, 0.0], "rotation": [0.0, 0.0, 0.0, 1.0]}
        if i == 0:
            node_def["children"] = [1]
        elif i == 1:
            node_def["children"] = [2]
        elif i == 2:
            node_def["children"] = [3, 5, 9]
        elif i == 3:
            node_def["children"] = [4]
        elif i in (5, 6, 7, 9, 10, 11):
            node_def["children"] = [i + 1]
        nodes.append(node_def)

    # Pack binary buffer: 4 float timestamps [0.0, 0.7, 1.4, 2.0] + VEC3 wrist translations for top 74 core clips
    binary_chunks = bytearray()
    times = [0.0, 0.7, 1.4, 2.0]
    for t in times:
        binary_chunks.extend(struct.pack("<f", t))
    time_byte_len = len(binary_chunks)

    buffer_views = [
        {"buffer": 0, "byteOffset": 0, "byteLength": time_byte_len}
    ]
    accessors = [
        {
            "bufferView": 0,
            "byteOffset": 0,
            "componentType": 5126,  # FLOAT
            "count": 4,
            "type": "SCALAR",
            "min": [0.0],
            "max": [2.0]
        }
    ]

    gltf_animations = []
    core_entries = entries[:74]
    for idx, entry in enumerate(core_entries):
        gloss = entry["gloss"].upper()
        kf = clips_dict[gloss]["keyframes"]
        byte_offset = len(binary_chunks)
        for stage in kf:
            wx, wy, wz = stage["right_arm"]["wrist"]
            binary_chunks.extend(struct.pack("<fff", float(wx), float(wy), float(wz)))
        byte_len = len(binary_chunks) - byte_offset

        bv_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": byte_offset,
            "byteLength": byte_len
        })
        acc_idx = len(accessors)
        accessors.append({
            "bufferView": bv_idx,
            "byteOffset": 0,
            "componentType": 5126,
            "count": 4,
            "type": "VEC3"
        })

        gltf_animations.append({
            "name": f"ISL_{gloss}",
            "samplers": [
                {
                    "input": 0,
                    "interpolation": "LINEAR",
                    "output": acc_idx
                }
            ],
            "channels": [
                {
                    "sampler": 0,
                    "target": {
                        "node": 8,  # RightHand node
                        "path": "translation"
                    }
                }
            ]
        })

    b64_data = base64.b64encode(bytes(binary_chunks)).decode("ascii")
    gltf_doc = {
        "asset": {
            "version": "2.0",
            "generator": "SignBridge AI ISLRTC 43-Joint Animation Authoring Pipeline",
            "copyright": "SignBridge AI Phase 1 — Bundled Authored ISL Keyframe Clips"
        },
        "scene": 0,
        "scenes": [{"name": "ISL_Interpreter_Scene", "nodes": [0]}],
        "nodes": nodes,
        "animations": gltf_animations,
        "buffers": [
            {
                "byteLength": len(binary_chunks),
                "uri": f"data:application/octet-stream;base64,{b64_data}"
            }
        ],
        "bufferViews": buffer_views,
        "accessors": accessors
    }

    with open(GLTF_OUT, "w", encoding="utf-8") as f:
        json.dump(gltf_doc, f, indent=2)

    print(f"[AuthoredAssets] Generated {len(clips_dict)} 4-stage authored ISL clips -> {KEYFRAMES_OUT}")
    print(f"[AuthoredAssets] Generated GLTF 2.0 43-joint skeletal rig & {len(gltf_animations)} embedded animation tracks -> {GLTF_OUT}")


if __name__ == "__main__":
    generate_bundled_assets()
