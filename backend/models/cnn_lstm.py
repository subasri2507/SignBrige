import os
import json
import numpy as np

# Check if PyTorch or TensorFlow is available
TORCH_AVAILABLE = False
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    pass

if TORCH_AVAILABLE:
    class ISL_CNN_LSTM_Torch(nn.Module):
        """
        CNN-LSTM Architecture for Indian Sign Language (ISL) recognition.
        Input: Temporal landmark sequences of shape [Batch, Sequence_Length (30), Feature_Dim (126)]
               (Left hand: 21x3=63, Right hand: 21x3=63 -> 126 coordinates)
        """
        def __init__(self, input_dim=126, hidden_dim=128, num_layers=2, num_classes=21, dropout=0.3):
            super(ISL_CNN_LSTM_Torch, self).__init__()
            
            # 1D Temporal Convolutional layers to extract spatial-temporal landmark patterns
            # Transpose input to [Batch, Channels=126, Length=30]
            self.conv1 = nn.Conv1d(in_channels=input_dim, out_channels=64, kernel_size=3, padding=1)
            self.bn1 = nn.BatchNorm1d(64)
            self.relu = nn.ReLU()
            self.conv2 = nn.Conv1d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
            self.bn2 = nn.BatchNorm1d(128)
            self.pool = nn.MaxPool1d(kernel_size=2)  # 30 -> 15
            self.dropout = nn.Dropout(dropout)
            
            # Bidirectional LSTM to capture sequential temporal dynamics of signing
            self.lstm = nn.LSTM(
                input_size=128,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True,
                bidirectional=True,
                dropout=dropout if num_layers > 1 else 0
            )
            
            # Fully connected classifier layers
            self.fc1 = nn.Linear(hidden_dim * 2, 192)
            self.fc2 = nn.Linear(192, num_classes)
            
        def forward(self, x):
            # Input x: [Batch, Seq_Len=30, Feat_Dim=126]
            x = x.permute(0, 2, 1)  # -> [Batch, Feat_Dim=126, Seq_Len=30]
            x = self.relu(self.bn1(self.conv1(x)))
            x = self.relu(self.bn2(self.conv2(x)))
            x = self.pool(x)       # -> [Batch, 128, 15]
            x = self.dropout(x)
            
            x = x.permute(0, 2, 1) # -> [Batch, 15, 128]
            lstm_out, _ = self.lstm(x)  # -> [Batch, 15, hidden_dim * 2]
            
            # Global Average Pooling over time dimension
            pooled = torch.mean(lstm_out, dim=1) # -> [Batch, hidden_dim * 2]
            
            x = self.relu(self.fc1(pooled))
            x = self.dropout(x)
            logits = self.fc2(x)
            return logits

class ISLModelWrapper:
    """
    Modular wrapper for loading, inference, and managing the CNN-LSTM model.
    """
    def __init__(self, weights_path=None, config_path=None):
        self.weights_path = weights_path
        self.config_path = config_path
        self.model = None
        self.classes = []
        self.is_trained_model_loaded = False
        self.device = "cpu"
        self._load_config()
        self._initialize_model()

    def _load_config(self):
        if self.config_path and os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                self.classes = cfg.get("supported_glosses", []) + ["UNKNOWN"]
        else:
            self.classes = [
                "NAMASTE", "HELLO", "HELP", "WATER", "THANK_YOU",
                "YES", "NO", "I", "YOU", "GOOD", "BAD",
                "PLEASE", "TEACHER", "STUDENT", "CLASSROOM",
                "FOOD", "RESTROOM", "WELCOME", "UNDERSTAND", "STOP",
                "UNKNOWN"
            ]

    def _initialize_model(self):
        if TORCH_AVAILABLE:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            try:
                self.model = ISL_CNN_LSTM_Torch(
                    input_dim=126,
                    hidden_dim=128,
                    num_layers=2,
                    num_classes=len(self.classes)
                )
                if self.weights_path and os.path.exists(self.weights_path):
                    state_dict = torch.load(self.weights_path, map_location=self.device)
                    self.model.load_state_dict(state_dict)
                    self.model.to(self.device)
                    self.model.eval()
                    self.is_trained_model_loaded = True
                    print(f"[ModelWrapper] Loaded trained CNN-LSTM weights from {self.weights_path}")
                else:
                    self.is_trained_model_loaded = False
                    print("[ModelWrapper] Model architecture initialized. No trained weights file found; baseline active.")
            except Exception as e:
                print(f"[ModelWrapper] Initialization notice: {e}")
                self.is_trained_model_loaded = False
        else:
            print("[ModelWrapper] PyTorch not detected. Operating in high-precision landmark baseline mode.")

    def predict(self, sequence_landmarks):
        """
        Run inference on sequence [30, 126].
        Returns: (predicted_class_name, confidence_float)
        """
        if not self.is_trained_model_loaded or not TORCH_AVAILABLE or self.model is None:
            return None, 0.0

        try:
            arr = np.array(sequence_landmarks, dtype=np.float32)
            if arr.ndim == 2:
                arr = np.expand_dims(arr, axis=0) # [1, 30, 126]
            
            with torch.no_grad():
                tensor_in = torch.from_numpy(arr).to(self.device)
                logits = self.model(tensor_in)
                probs = F.softmax(logits, dim=-1).cpu().numpy()[0]
                pred_idx = int(np.argmax(probs))
                confidence = float(probs[pred_idx])
                predicted_class = self.classes[pred_idx] if pred_idx < len(self.classes) else "UNKNOWN"
                return predicted_class, confidence
        except Exception as e:
            print(f"[ModelWrapper] Predict error: {e}")
            return None, 0.0
