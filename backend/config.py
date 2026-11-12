import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "database"
UPLOADS_DIR = BASE_DIR / "uploads"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "signbridge-ai-secret-key-phase1-2026")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{DATA_DIR / 'signbridge.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    UPLOAD_FOLDER = str(UPLOADS_DIR)
    
    # Server ports
    HOST = os.environ.get("HOST", "0.0.0.0")
    PORT = int(os.environ.get("PORT", 5000))
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")

    # Primary Sign Language & Supported Sign Language Variants
    SIGN_LANGUAGE = "ISL"
    SUPPORTED_SIGN_LANGUAGES = ["ISL", "ISL_SOUTH", "ISL_NORTH", "ASL", "BSL"]
    
    # Supported Spoken Languages (9 Indian & International Languages)
    SUPPORTED_SPOKEN_LANGUAGES = ["en", "ta", "hi", "te", "ml", "kn", "mr", "bn", "gu"]
    DEFAULT_SPOKEN_LANGUAGE = "en"
    
    # Recognition Thresholds
    CONFIDENCE_THRESHOLD_HIGH = float(os.environ.get("CONF_HIGH", 0.75))
    CONFIDENCE_THRESHOLD_MEDIUM = float(os.environ.get("CONF_MED", 0.50))
    
    # Paths for model assets
    CNN_LSTM_WEIGHTS_PATH = str(BASE_DIR / "models" / "weights" / "isl_cnn_lstm.pth")
    ISL_DICTIONARY_PATH = str(BASE_DIR / "isl" / "isl_dictionary.json")
    ISL_CONFIG_PATH = str(BASE_DIR / "isl" / "isl_config.json")
