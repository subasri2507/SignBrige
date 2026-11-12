import sys
import os
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from database.db import init_db, SessionLocal
from database.models import Conversation, Message, RecognitionCorrection, SignDictionary

TEST_DB_URI = f"sqlite:///{BASE_DIR / 'database' / 'test_signbridge.db'}"

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db(TEST_DB_URI)
    yield
    # Cleanup test db
    test_db_file = BASE_DIR / "database" / "test_signbridge.db"
    if test_db_file.exists():
        try:
            os.remove(test_db_file)
        except Exception:
            pass

def test_create_and_retrieve_conversation():
    db = SessionLocal()
    try:
        conv = Conversation(title="Classroom Test 101")
        db.add(conv)
        db.commit()
        db.refresh(conv)

        assert conv.id is not None
        assert conv.title == "Classroom Test 101"

        retrieved = db.query(Conversation).filter(Conversation.id == conv.id).first()
        assert retrieved is not None
        assert retrieved.title == "Classroom Test 101"
    finally:
        db.close()

def test_add_message_to_conversation():
    db = SessionLocal()
    try:
        conv = Conversation(title="Session With Messages")
        db.add(conv)
        db.commit()
        db.refresh(conv)

        msg1 = Message(
            conversation_id=conv.id,
            sender_type="hearing",
            direction="voice_to_sign",
            original_text="I need help",
            translated_text="I need help",
            recognized_gloss="I HELP",
            spoken_language="en",
            confidence=1.0
        )
        msg2 = Message(
            conversation_id=conv.id,
            sender_type="deaf",
            direction="sign_to_speech",
            original_text="WATER",
            translated_text="I need water.",
            recognized_gloss="WATER",
            spoken_language="en",
            confidence=0.88
        )
        db.add_all([msg1, msg2])
        db.commit()

        msgs = db.query(Message).filter(Message.conversation_id == conv.id).all()
        assert len(msgs) == 2
        assert msgs[0].direction == "voice_to_sign"
        assert msgs[1].direction == "sign_to_speech"
    finally:
        db.close()

def test_recognition_correction_storage():
    db = SessionLocal()
    try:
        corr = RecognitionCorrection(
            original_prediction="WATER",
            corrected_label="FOOD",
            language="en",
            notes="Fingers were clustered near lips"
        )
        db.add(corr)
        db.commit()
        db.refresh(corr)

        assert corr.id is not None
        assert corr.original_prediction == "WATER"
        assert corr.corrected_label == "FOOD"
    finally:
        db.close()
