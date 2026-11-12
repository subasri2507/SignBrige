import os
import sys
import json
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from preprocessing import load_preprocessed_dataset
from models.cnn_lstm import ISL_CNN_LSTM_Torch

WEIGHTS_DIR = BASE_DIR / "backend" / "models" / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_SAVE_PATH = WEIGHTS_DIR / "isl_cnn_lstm.pth"
METRICS_PATH = BASE_DIR / "training" / "training_metrics.json"
EVAL_REPORT_PATH = BASE_DIR / "training" / "evaluation_report.json"


def train_model(epochs=12, batch_size=128, lr=0.003):
    print("==========================================================", flush=True)
    print("  SignBridge AI - CNN-LSTM Training Pipeline (501 Classes)", flush=True)
    print("==========================================================", flush=True)

    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import TensorDataset, DataLoader
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support

    torch.manual_seed(42)
    np.random.seed(42)

    X, y, label_map = load_preprocessed_dataset()
    num_classes = len(label_map)

    X_train_np, X_val_np, y_train_np, y_val_np = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    X_train = torch.FloatTensor(X_train_np)
    y_train = torch.LongTensor(y_train_np)
    X_val = torch.FloatTensor(X_val_np)
    y_val = torch.LongTensor(y_val_np)

    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=batch_size, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Training] Compute device: {device} | Classes: {num_classes} | Train: {len(X_train)} | Val: {len(X_val)}", flush=True)

    model = ISL_CNN_LSTM_Torch(
        input_dim=126,
        hidden_dim=128,
        num_layers=2,
        num_classes=num_classes,
        dropout=0.15
    ).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        train_correct = 0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * len(batch_y)
            train_correct += (outputs.argmax(dim=1) == batch_y).sum().item()

        scheduler.step()
        train_loss = running_loss / len(train_loader.dataset)
        train_acc = train_correct / len(train_loader.dataset)

        model.eval()
        val_loss = 0.0
        val_preds = []
        val_targets = []
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                val_loss += loss.item() * len(batch_y)
                preds = outputs.argmax(dim=1)
                val_preds.extend(preds.cpu().numpy().tolist())
                val_targets.extend(batch_y.cpu().numpy().tolist())

        epoch_val_loss = val_loss / len(val_loader.dataset)
        epoch_val_acc = accuracy_score(val_targets, val_preds)

        history["train_loss"].append(round(float(train_loss), 4))
        history["train_acc"].append(round(float(train_acc), 4))
        history["val_loss"].append(round(float(epoch_val_loss), 4))
        history["val_acc"].append(round(float(epoch_val_acc), 4))

        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save(model.state_dict(), str(MODEL_SAVE_PATH))

        print(
            f"Epoch {epoch:02d}/{epochs:02d} - "
            f"Train Loss: {train_loss:.4f} (Acc: {train_acc*100:.1f}%) - "
            f"Val Loss: {epoch_val_loss:.4f} (Val Acc: {epoch_val_acc*100:.2f}%)",
            flush=True
        )

    model.load_state_dict(torch.load(str(MODEL_SAVE_PATH), map_location=device))
    model.eval()
    final_preds = []
    final_targets = []
    with torch.no_grad():
        for batch_x, batch_y in val_loader:
            outputs = model(batch_x.to(device))
            final_preds.extend(outputs.argmax(dim=1).cpu().numpy().tolist())
            final_targets.extend(batch_y.numpy().tolist())

    val_acc = float(accuracy_score(final_targets, final_preds))
    prec, rec, f1, _ = precision_recall_fscore_support(
        final_targets, final_preds, average="macro", zero_division=0
    )

    print(f"\n[Training Complete] Best Weights Saved -> {MODEL_SAVE_PATH}", flush=True)
    print(f"[Metrics] Val Accuracy: {val_acc*100:.2f}% | Precision: {prec*100:.2f}% | Recall: {rec*100:.2f}% | F1-Score: {f1*100:.2f}%", flush=True)

    metrics_payload = {
        "status": "trained",
        "is_trained_model": True,
        "architecture": f"ISL_CNN_LSTM_Torch (Conv1D[64,128] + BiLSTM[128x2] + Dense[192,{num_classes}])",
        "num_classes": num_classes,
        "vocabulary_size": num_classes - 1,
        "total_samples": int(len(X)),
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
        "epochs": epochs,
        "final_train_loss": history["train_loss"][-1],
        "final_train_accuracy": history["train_acc"][-1],
        "final_val_loss": history["val_loss"][-1],
        "validation_accuracy": round(val_acc, 4),
        "accuracy": round(val_acc, 4),
        "precision_macro": round(float(prec), 4),
        "recall_macro": round(float(rec), 4),
        "f1_score_macro": round(float(f1), 4),
        "weights_file": str(MODEL_SAVE_PATH),
        "history": history
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    with open(EVAL_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)


if __name__ == "__main__":
    train_model(epochs=12, batch_size=128, lr=0.003)
