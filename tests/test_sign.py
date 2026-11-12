import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from services.gloss_mapping import ISLGlossMapper
from services.confidence import ConfidenceService
from isl.isl_recognition import ISLRecognitionEngine
from avatar.animation_mapper import AnimationMapper
from avatar.avatar_controller import AvatarController

def test_gloss_mapping_supported():
    mapper = ISLGlossMapper()
    res = mapper.map_sentence("I need help please", language="en")
    assert "I" in res["supported_glosses"]
    assert "HELP" in res["supported_glosses"]
    assert "PLEASE" in res["supported_glosses"]
    assert res["has_unsupported"] is False

def test_gloss_mapping_stop_words_filtered():
    mapper = ISLGlossMapper()
    # 'is', 'a' are filler copulas omitted in ISL syntax
    res = mapper.map_sentence("The teacher is good", language="en")
    assert "TEACHER" in res["supported_glosses"]
    assert "GOOD" in res["supported_glosses"]
    # Check that 'is' is marked omitted
    omitted = [t["original"] for t in res["tokens"] if t.get("omitted_as_filler")]
    assert "is" in omitted or "the" in omitted

def test_unknown_word_handling():
    mapper = ISLGlossMapper()
    res = mapper.map_sentence("Elephant spacecraft hello", language="en")
    assert res["has_unsupported"] is True
    assert "elephant" in res["unsupported_words"]
    assert "spacecraft" in res["unsupported_words"]
    assert "HELLO" in res["supported_glosses"]
    assert res["warning_message"] is not None

def test_confidence_evaluation_levels():
    service = ConfidenceService(high_thresh=0.75, med_thresh=0.50)
    
    high = service.evaluate(0.90)
    assert high["level"] == "HIGH"
    assert high["action"] == "ACCEPT"

    med = service.evaluate(0.60)
    assert med["level"] == "MEDIUM"
    assert med["action"] == "CONFIRM_ALTERNATIVE"

    low = service.evaluate(0.35)
    assert low["level"] == "LOW"
    assert low["action"] == "REPEAT_SIGN"

def test_avatar_animation_mapper():
    mapper = AnimationMapper()
    anim = mapper.get_animation("NAMASTE")
    assert anim is not None
    assert anim["id"] == "anim_namaste"
    assert "duration" in anim
    assert "procedural_pose" in anim

def test_avatar_controller_timeline():
    controller = AvatarController()
    seq = ["HELLO", "HELP", "WATER"]
    res = controller.build_sequence_timeline(seq)
    assert res["ready_to_play"] is True
    assert len(res["timeline"]) == 3
    assert res["total_duration"] > 0
    assert len(res["unsupported"]) == 0

def test_landmark_baseline_empty():
    engine = ISLRecognitionEngine()
    res = engine.recognize_from_landmarks(left_hand=None, right_hand=None)
    assert res["gloss"] == "UNKNOWN"
    assert res["status"] == "no_hands_detected"
