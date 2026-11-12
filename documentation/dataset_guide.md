# ISL Dataset & CNN-LSTM Training Guide

This guide explains how to prepare an Indian Sign Language (ISL) dataset and train the CNN-LSTM deep learning model for Phase 1 and future Phase 2 expansions.

---

## 1. Dataset Directory Organization

```
datasets/isl/
├── videos/         # Place raw video recordings (.mp4) organized by class name
│   ├── NAMASTE/
│   │   ├── user1_sample1.mp4
│   │   └── user2_sample2.mp4
│   ├── HELP/
│   ├── WATER/
│   └── ...
├── landmarks/      # Extracted MediaPipe NumPy sequences (.npy) [N, 30, 126]
└── labels/         # Label mapping dictionary (label_map.json)
```

---

## 2. Landmark Sequence Specifications

- **Temporal Length:** 30 consecutive video frames (approx. 1 second at 30 FPS).
- **Features per Frame:** 126 floating-point values:
  - Left Hand (21 points $\times$ 3 coordinates $\{x, y, z\}$ = 63 values)
  - Right Hand (21 points $\times$ 3 coordinates $\{x, y, z\}$ = 63 values)
- **Normalization:** Normalized coordinates within $[0.0, 1.0]$ relative to image boundaries with wrist centered.

---

## 3. Data Preprocessing

Run the preprocessing script to extract MediaPipe landmarks and generate standardized training tensors:

```bash
cd SignBridgeAI
python training/preprocessing.py
```

This processes all video files into `.npy` sequence files inside `datasets/isl/landmarks/` and generates `datasets/isl/labels/label_map.json`.

---

## 4. Model Training

Run the CNN-LSTM training pipeline:

```bash
python training/train_cnn_lstm.py
```

- **Architecture:** 2 $\times$ Conv1D Layers $\rightarrow$ BatchNorm $\rightarrow$ MaxPool $\rightarrow$ 2-Layer Bidirectional LSTM $\rightarrow$ Dense Classification Layer.
- **Optimizer:** Adam ($\text{lr}=10^{-3}$, weight decay $=10^{-4}$).
- **Output Weights:** Saved to `backend/models/weights/isl_cnn_lstm.pth`.
- **Metrics Log:** Written to `training/training_metrics.json`.

---

## 5. Model Evaluation

Evaluate accuracy, per-class recall, and confusion matrix:

```bash
python training/evaluate_model.py
```
Outputs evaluation report to `training/evaluation_report.json`.
