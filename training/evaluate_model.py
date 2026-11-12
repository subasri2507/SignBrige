import os
import sys
import json
import numpy as np
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from preprocessing import load_preprocessed_dataset
from models.cnn_lstm import ISLModelWrapper
from config import Config


def evaluate():
    print("==========================================================")
    print("  SignBridge AI - CNN-LSTM Evaluation Suite (75 Classes)")
    print("==========================================================")

    wrapper = ISLModelWrapper(
        weights_path=Config.CNN_LSTM_WEIGHTS_PATH,
        config_path=Config.ISL_CONFIG_PATH
    )

    X, y, label_map = load_preprocessed_dataset()
    idx_to_label = {v: k for k, v in label_map.items()}

    print(f"[Evaluation] Total evaluation samples: {len(X)}")
    print(f"[Evaluation] Active Model Engine: {'Trained PyTorch CNN-LSTM' if wrapper.is_trained_model_loaded else 'Landmark Baseline'}")

    y_true = []
    y_pred = []
    confidences = []

    for i in range(len(X)):
        sample = X[i]
        true_label = idx_to_label.get(int(y[i]), "UNKNOWN")
        pred_label, conf = wrapper.predict(sample)
        if pred_label is None:
            pred_label = "UNKNOWN"
            conf = 0.0
        y_true.append(true_label)
        y_pred.append(pred_label)
        confidences.append(float(conf))

    acc = float(accuracy_score(y_true, y_pred))
    prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    mean_conf = float(np.mean(confidences)) if confidences else 0.0

    print(f"[Evaluation] Accuracy:  {acc*100:.2f}% ({sum(t == p for t, p in zip(y_true, y_pred))}/{len(X)})")
    print(f"[Evaluation] Precision: {prec*100:.2f}% | Recall: {rec*100:.2f}% | F1-Score: {f1*100:.2f}%")
    print(f"[Evaluation] Mean Prediction Confidence: {mean_conf*100:.2f}%")

    report = {
        "status": "evaluated",
        "is_trained_model": wrapper.is_trained_model_loaded,
        "architecture": "ISL_CNN_LSTM_Torch (Conv1D + BiLSTM + Dense)",
        "samples_evaluated": int(len(X)),
        "label_count": len(label_map),
        "accuracy": round(acc, 4),
        "precision_macro": round(float(prec), 4),
        "recall_macro": round(float(rec), 4),
        "f1_score_macro": round(float(f1), 4),
        "mean_confidence": round(mean_conf, 4)
    }

    eval_out = BASE_DIR / "training" / "evaluation_report.json"
    with open(eval_out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"[Evaluation] Saved evaluation report to {eval_out}")
    return report


if __name__ == "__main__":
    evaluate()
