import sys
import json
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app import create_app
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR / 'database' / 'test_api.db'}"

@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        yield client

def test_health_check_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["sign_language"] == "ISL"
    assert "en" in data["supported_spoken_languages"]

def test_voice_to_sign_pipeline(client):
    payload = {"text": "Hello, I need help", "spoken_language": "en"}
    res = client.post("/api/voice/to-sign", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "HELLO" in data["supported_glosses"]
    assert "HELP" in data["supported_glosses"]
    assert data["avatar_sequence"]["ready_to_play"] is True

def test_sign_to_speech_pipeline(client):
    payload = {"glosses": ["WATER", "PLEASE"], "target_lang": "en"}
    res = client.post("/api/sign/to-speech", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "water" in data["generated_text"].lower()

def test_speech_translation_endpoint(client):
    payload = {"text": "water", "source_lang": "en", "target_lang": "hi"}
    res = client.post("/api/speech/translate", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "पानी" in data["translated_text"]

def test_avatar_animations_list(client):
    res = client.get("/api/avatar/animations")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["count"] >= 15

def test_conversations_api(client):
    # Create conversation
    create_res = client.post("/api/conversations", json={"title": "Integration Test Conv"})
    assert create_res.status_code == 201
    conv_id = create_res.get_json()["conversation"]["id"]

    # Add message
    msg_res = client.post(f"/api/conversations/{conv_id}/messages", json={
        "sender_type": "hearing",
        "direction": "voice_to_sign",
        "original_text": "Good morning",
        "recognized_gloss": "GOOD"
    })
    assert msg_res.status_code == 201

    # Fetch messages
    get_res = client.get(f"/api/conversations/{conv_id}/messages")
    assert get_res.status_code == 200
    assert len(get_res.get_json()["messages"]) == 1

def test_settings_api(client):
    res = client.get("/api/settings")
    assert res.status_code == 200
    settings = res.get_json()["settings"]
    assert settings["fixed_sign_language"]["code"] == "ISL"

    # Update
    update_res = client.put("/api/settings", json={"tts_speed": 1.2})
    assert update_res.status_code == 200
    assert update_res.get_json()["settings"]["tts_speed"] == 1.2

def test_trained_model_metrics_endpoint(client):
    res = client.get("/api/sign/model-metrics")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["metrics"]["is_trained_model"] is True
    assert data["metrics"]["num_classes"] >= 500
    assert data["metrics"]["validation_accuracy"] >= 0.90

def test_continuous_sign_stream_endpoint(client):
    res = client.post("/api/sign/recognize-continuous", json={
        "gloss_stream": ["HELLO", "I", "NEED", "HELP"],
        "target_lang": "ta"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["sign_count"] == 4
    assert "help" in data["multilingual_translations"]["en"].lower()
    assert len(data["multilingual_translations"]) == 9

def test_open_vocabulary_fingerspelling_fallback(client):
    res = client.post("/api/voice/to-sign", json={
        "text": "Hello Quantum",
        "spoken_language": "en"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "HELLO" in data["supported_glosses"]
    assert "SPELL:QUANTUM" in data["full_sign_sequence"]

def test_bundled_gltf_and_authored_clips_endpoints(client):
    gltf_res = client.get("/api/avatar/gltf-info")
    assert gltf_res.status_code == 200
    gltf_data = gltf_res.get_json()
    assert gltf_data["success"] is True
    assert gltf_data["gltf_exists"] is True
    assert gltf_data["rig_joints"] == 43
    assert gltf_data["bundled_authored_clips"] == 500

    clip_res = client.get("/api/avatar/clip/NAMASTE")
    assert clip_res.status_code == 200
    clip_data = clip_res.get_json()
    assert clip_data["success"] is True
    assert len(clip_data["clip"]["authored_keyframes"]) == 4

def test_deaf_signer_user_study_endpoints(client):
    summary_res = client.get("/api/study/summary")
    assert summary_res.status_code == 200
    summary_data = summary_res.get_json()
    assert summary_data["success"] is True
    assert summary_data["total_participants"] >= 6
    assert summary_data["mean_sus_score"] >= 80.0

    submit_res = client.post("/api/study/submit", json={
        "participant_code": "DS-TEST-99",
        "participant_group": "deaf_signer",
        "isl_proficiency": "native",
        "preferred_region": "ISL_SOUTH",
        "sign_comprehension_rate": 95.0,
        "avatar_naturalness_score": 5,
        "recognition_responsiveness_score": 5,
        "translation_accuracy_score": 5,
        "ui_accessibility_score": 5,
        "qualitative_feedback": "Clear 4-stage keyframe holds and fingerspelling."
    })
    assert submit_res.status_code == 201
    eval_data = submit_res.get_json()["evaluation"]
    assert eval_data["participant_code"] == "DS-TEST-99"
    assert eval_data["is_pilot_baseline"] is False
    assert eval_data["sus_score"] == 100.0

