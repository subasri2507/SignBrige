import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from services.speech_recognition import SpeechRecognitionService
from services.text_to_speech import TextToSpeechService

def test_speech_recognition_text_processing():
    service = SpeechRecognitionService()
    cleaned = service.process_transcription_text("   Hello World!  ", "en")
    assert cleaned == "Hello World!"
    
    empty = service.process_transcription_text("", "en")
    assert empty == ""

def test_speech_synthesis_english():
    tts = TextToSpeechService()
    res = tts.synthesize("Hello, welcome to class", language="en")
    assert res["success"] is True
    assert res["language"] == "en"
    assert res["text"] == "Hello, welcome to class"

def test_speech_synthesis_tamil():
    tts = TextToSpeechService()
    res = tts.synthesize("வணக்கம்", language="ta")
    assert res["success"] is True
    assert res["language"] == "ta"

def test_speech_synthesis_hindi():
    tts = TextToSpeechService()
    res = tts.synthesize("नमस्ते", language="hi")
    assert res["success"] is True
    assert res["language"] == "hi"

def test_speech_synthesis_empty():
    tts = TextToSpeechService()
    res = tts.synthesize("", language="en")
    assert res["success"] is False
    assert "error" in res
