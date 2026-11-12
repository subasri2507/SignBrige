import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from services.translation import TranslationService
from services.sentence_generation import SentenceGenerationService

def test_translation_identity():
    trans = TranslationService()
    res = trans.translate("Hello", source_lang="en", target_lang="en")
    assert res["translated_text"] == "Hello"
    assert res["engine"] == "identity"

def test_translation_english_to_tamil():
    trans = TranslationService()
    res = trans.translate("help", source_lang="en", target_lang="ta")
    assert "உதவி" in res["translated_text"]

def test_translation_english_to_hindi():
    trans = TranslationService()
    res = trans.translate("water", source_lang="en", target_lang="hi")
    assert "पानी" in res["translated_text"]

def test_sentence_generation_single_gloss():
    gen = SentenceGenerationService()
    res = gen.generate_sentence(["HELP"], target_lang="en")
    assert res["is_template_match"] is True
    assert "help" in res["text"].lower()

def test_sentence_generation_multi_gloss():
    gen = SentenceGenerationService()
    res = gen.generate_sentence(["WATER", "PLEASE"], target_lang="en")
    assert res["is_template_match"] is True
    assert "water" in res["text"].lower()

def test_sentence_generation_tamil_output():
    gen = SentenceGenerationService()
    res = gen.generate_sentence(["HELP"], target_lang="ta")
    assert res["target_lang"] == "ta"
    assert "உதவி" in res["text"]
