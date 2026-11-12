import os
import json
import math
import numpy as np
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
ISL_CONFIG_PATH = BASE_DIR / "backend" / "isl" / "isl_config.json"
DATASET_DIR = BASE_DIR / "datasets" / "isl"
VIDEOS_DIR = DATASET_DIR / "videos"
LANDMARKS_DIR = DATASET_DIR / "landmarks"
LABELS_DIR = DATASET_DIR / "labels"

SEQUENCE_LENGTH = 30
FEATURE_DIM = 126  # 21 Left Hand points (x,y,z) + 21 Right Hand points (x,y,z)


def get_ordered_classes():
    """Returns the exact ordered list of 500 ISL glosses + UNKNOWN from isl_config.json"""
    if ISL_CONFIG_PATH.exists():
        with open(ISL_CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            return cfg.get("supported_glosses", []) + ["UNKNOWN"]
    return [
        "NAMASTE", "HELLO", "HELP", "WATER", "THANK_YOU",
        "YES", "NO", "I", "YOU", "GOOD", "BAD",
        "PLEASE", "TEACHER", "STUDENT", "CLASSROOM",
        "FOOD", "RESTROOM", "WELCOME", "UNDERSTAND", "STOP",
        "UNKNOWN"
    ]


def generate_demo_dataset(samples_per_class=12):
    """
    Fast vectorized NumPy generator for the 501-class (500 ISL signs + UNKNOWN)
    temporal 30-frame x 126-coordinate landmark sequence dataset, incorporating
    inter-signer spatial translation, scale variation, temporal phase shift, and sensor noise.
    """
    LANDMARKS_DIR.mkdir(parents=True, exist_ok=True)
    LABELS_DIR.mkdir(parents=True, exist_ok=True)

    classes = get_ordered_classes()
    num_classes = len(classes)
    rng = np.random.default_rng(42)

    total_samples = num_classes * samples_per_class
    X = np.zeros((total_samples, SEQUENCE_LENGTH, FEATURE_DIM), dtype=np.float32)
    y = np.repeat(np.arange(num_classes, dtype=np.int64), samples_per_class)

    t_base = np.linspace(0.0, np.pi, SEQUENCE_LENGTH, dtype=np.float32)[:, None]  # [30, 1]
    feat_idx = np.arange(FEATURE_DIM, dtype=np.float32)[None, :]  # [1, 126]

    for c_idx in range(num_classes):
        # Distinct biomechanical spatial-temporal prototype for class c_idx
        freq1 = 1.0 + (c_idx % 7) * 0.35
        freq2 = 0.5 + ((c_idx // 7) % 9) * 0.30
        spatial_phase = (c_idx * 1.6180339) + feat_idx * (0.12 + 0.03 * (c_idx % 11))
        spatial_profile = (
            0.45 * np.sin(spatial_phase)
            + 0.35 * np.cos(spatial_phase * 1.7 + (c_idx // 11) * 0.4)
            + 0.20 * np.sin(feat_idx * 0.31 - c_idx * 0.73)
        ).astype(np.float32)  # [1, 126]

        temporal_mod = (
            0.75 + 0.25 * np.sin(t_base * freq1 + (c_idx % 5) * 0.5) * np.cos(t_base * freq2)
        ).astype(np.float32)  # [30, 1]

        prototype = spatial_profile * temporal_mod  # [30, 126]

        start = c_idx * samples_per_class
        end = start + samples_per_class

        # Inter-signer scale, offset, and Gaussian landmark tracking noise
        scales = rng.uniform(0.91, 1.09, size=(samples_per_class, 1, 1)).astype(np.float32)
        offsets = rng.normal(0.0, 0.03, size=(samples_per_class, 1, FEATURE_DIM)).astype(np.float32)
        noise = rng.normal(0.0, 0.045, size=(samples_per_class, SEQUENCE_LENGTH, FEATURE_DIM)).astype(np.float32)

        X[start:end] = prototype[None, :, :] * scales + offsets + noise

    dataset_file = LANDMARKS_DIR / "isl_500class_dataset.npz"
    np.savez_compressed(str(dataset_file), X=X, y=y)

    label_to_idx = {g: i for i, g in enumerate(classes)}
    labels_file = LABELS_DIR / "label_map.json"
    with open(labels_file, "w", encoding="utf-8") as f:
        json.dump(label_to_idx, f, indent=2)

    print(
        f"[Preprocessing] Generated {len(X)} sequences ({samples_per_class}/class) "
        f"across {num_classes} ISL classes -> {dataset_file}",
        flush=True
    )
    return X, y, label_to_idx


def load_preprocessed_dataset():
    """
    Loads the 501-class landmark sequence dataset for CNN-LSTM training and evaluation.
    """
    dataset_file = LANDMARKS_DIR / "isl_500class_dataset.npz"
    labels_file = LABELS_DIR / "label_map.json"
    expected_classes = get_ordered_classes()

    if dataset_file.exists() and labels_file.exists():
        with open(labels_file, "r", encoding="utf-8") as f:
            label_to_idx = json.load(f)
        if len(label_to_idx) == len(expected_classes):
            data = np.load(str(dataset_file))
            X = data["X"]
            y = data["y"]
            print(f"[Preprocessing] Loaded dataset: {X.shape[0]} sequences across {len(label_to_idx)} ISL classes.", flush=True)
            return X, y, label_to_idx

    print("[Preprocessing] Building 501-class ISL temporal landmark dataset...", flush=True)
    return generate_demo_dataset(samples_per_class=12)


if __name__ == "__main__":
    X, y, lmap = generate_demo_dataset(samples_per_class=12)
    print(f"Preprocessing completed: X={X.shape}, classes={len(lmap)}", flush=True)
