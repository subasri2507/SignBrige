from flask import Blueprint, request, jsonify
from isl.isl_recognition import ISLRecognitionEngine
from services.gloss_mapping import ISLGlossMapper
from services.translation import TranslationService
from services.sentence_generation import SentenceGenerationService
from services.text_to_speech import TextToSpeechService
from services.confidence import ConfidenceService
from avatar.avatar_controller import AvatarController
from utils.landmark_extraction import LandmarkExtractor
from database.db import SessionLocal
from database.models import RecognitionCorrection, SignDictionary

sign_bp = Blueprint("sign", __name__, url_prefix="/api")

recognition_engine = ISLRecognitionEngine()
landmark_extractor = LandmarkExtractor()
gloss_mapper = ISLGlossMapper()
translation_service = TranslationService()
sentence_service = SentenceGenerationService()
tts_service = TextToSpeechService()
confidence_service = ConfidenceService()
avatar_controller = AvatarController()

@sign_bp.route("/voice/to-sign", methods=["POST"])
def voice_to_sign_pipeline():
    """
    POST /api/voice/to-sign
    Complete Voice-to-Sign Pipeline:
    Text (from Speech) -> Translation (if needed) -> ISL Gloss Mapping -> Avatar Animation Timeline.
    Body: {"text": str, "spoken_language": "en"|"ta"|"hi"}
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "").strip()
    spoken_language = data.get("spoken_language", "en")

    if not text:
        return jsonify({"success": False, "error": "Field 'text' is required"}), 400

    # 1. Spoken Translation (standardize or translate to English for semantic gloss alignment if Tamil/Hindi)
    translated_en = text
    if spoken_language != "en":
        trans_res = translation_service.translate(text, source_lang=spoken_language, target_lang="en")
        translated_en = trans_res.get("translated_text", text)

    # 2. ISL Gloss Mapping
    gloss_res = gloss_mapper.map_sentence(text if spoken_language == "en" else translated_en, language="en")
    
    # 3. Avatar Sequence Timeline (includes both core signs and SPELL:* fingerspelling)
    avatar_timeline = avatar_controller.build_sequence_timeline(gloss_res.get("full_sign_sequence") or gloss_res["supported_glosses"])

    return jsonify({
        "success": True,
        "input_text": text,
        "spoken_language": spoken_language,
        "translated_text": translated_en if spoken_language != "en" else text,
        "gloss_sequence": gloss_res["gloss_sequence"],
        "supported_glosses": gloss_res["supported_glosses"],
        "full_sign_sequence": gloss_res.get("full_sign_sequence", gloss_res["supported_glosses"]),
        "fingerspelled_words": gloss_res.get("fingerspelled_words", []),
        "unsupported_words": gloss_res["unsupported_words"],
        "has_unsupported": gloss_res["has_unsupported"],
        "warning_message": gloss_res["warning_message"],
        "tokens": gloss_res["tokens"],
        "avatar_sequence": avatar_timeline
    }), 200

@sign_bp.route("/sign/gloss-map", methods=["POST"])
def map_gloss():
    """
    POST /api/sign/gloss-map
    Maps arbitrary text to ISL gloss sequence.
    Body: {"text": str, "language": "en"|"ta"|"hi"}
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "").strip()
    language = data.get("language", "en")

    if not text:
        return jsonify({"success": False, "error": "Field 'text' is required"}), 400

    result = gloss_mapper.map_sentence(text, language=language)
    return jsonify({"success": True, **result}), 200

@sign_bp.route("/sign/recognize", methods=["POST"])
def recognize_sign():
    """
    POST /api/sign/recognize
    Recognizes ISL sign from either a base64 webcam frame OR pre-extracted landmarks.
    Body: {
        "frame": "data:image/jpeg;base64,..." (optional),
        "image": "data:image/jpeg;base64,..." (optional),
        "left_hand": [...],
        "right_hand": [...],
        "pose": [...],
        "sequence": [...] (optional temporal sequence)
    }
    """
    data = request.get_json(force=True, silent=True) or {}
    left_hand = data.get("left_hand")
    right_hand = data.get("right_hand")
    pose = data.get("pose")
    sequence = data.get("sequence")

    # If a base64 webcam frame is provided, extract landmarks automatically
    frame_b64 = data.get("frame") or data.get("image")
    if frame_b64 and not left_hand and not right_hand:
        extracted = landmark_extractor.extract_from_base64(frame_b64)
        left_hand = extracted.get("left_hand")
        right_hand = extracted.get("right_hand")
        pose = extracted.get("pose")

    result = recognition_engine.recognize_from_landmarks(
        left_hand=left_hand,
        right_hand=right_hand,
        pose=pose,
        sequence=sequence
    )

    conf_eval = confidence_service.evaluate(result["confidence"])

    return jsonify({
        "success": True,
        **result,
        "confidence_evaluation": conf_eval
    }), 200

@sign_bp.route("/sign/translate", methods=["POST"])
def translate_sign_gloss():
    """
    POST /api/sign/translate
    Translates recognized ISL gloss(es) into natural sentences in target language.
    Body: {"glosses": ["HELP", "I"], "target_lang": "en"|"ta"|"hi"}
    """
    data = request.get_json(force=True, silent=True) or {}
    glosses = data.get("glosses", [])
    if isinstance(glosses, str):
        glosses = [glosses]
    target_lang = data.get("target_lang", "en")

    gen_res = sentence_service.generate_sentence(glosses, target_lang=target_lang)
    return jsonify({
        "success": True,
        **gen_res
    }), 200

@sign_bp.route("/sign/to-speech", methods=["POST"])
def sign_to_speech_pipeline():
    """
    POST /api/sign/to-speech
    End-to-End Sign-to-Speech:
    Recognized Glosses -> Natural Sentence Generation -> Spoken Translation -> TTS Audio Synthesis.
    Body: {"glosses": ["WATER", "PLEASE"], "target_lang": "en"|"ta"|"hi"}
    """
    data = request.get_json(force=True, silent=True) or {}
    glosses = data.get("glosses", [])
    if isinstance(glosses, str):
        glosses = [glosses]
    target_lang = data.get("target_lang", "en")

    # 1. Generate sentence
    sentence_res = sentence_service.generate_sentence(glosses, target_lang=target_lang)
    generated_text = sentence_res["text"]

    # 2. Synthesize speech
    tts_res = tts_service.synthesize(generated_text, language=target_lang)

    # 3. Build multilingual preview across all 9 supported languages
    multilingual_preview = {}
    for lang_code in ["en", "ta", "hi", "te", "ml", "kn", "mr", "bn", "gu"]:
        multilingual_preview[lang_code] = sentence_service.generate_sentence(glosses, target_lang=lang_code)["text"]

    return jsonify({
        "success": True,
        "glosses": glosses,
        "target_lang": target_lang,
        "generated_text": generated_text,
        "multilingual_translations": multilingual_preview,
        "is_template_match": sentence_res["is_template_match"],
        "audio": tts_res
    }), 200

@sign_bp.route("/sign/correct", methods=["POST"])
def submit_recognition_correction():
    """
    POST /api/sign/correct
    Saves user corrections to the recognition corrections table for continuous dataset learning.
    Body: {"original_prediction": str, "corrected_label": str, "language": str, "notes": str}
    """
    data = request.get_json(force=True, silent=True) or {}
    orig = data.get("original_prediction", "").strip()
    corr = data.get("corrected_label", "").strip()
    lang = data.get("language", "en")
    notes = data.get("notes", "")

    if not orig or not corr:
        return jsonify({"success": False, "error": "Both 'original_prediction' and 'corrected_label' are required"}), 400

    db = SessionLocal()
    try:
        correction = RecognitionCorrection(
            original_prediction=orig,
            corrected_label=corr,
            language=lang,
            notes=notes
        )
        db.add(correction)
        db.commit()
        db.refresh(correction)
        return jsonify({"success": True, "correction": correction.to_dict()}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()

@sign_bp.route("/sign/dictionary", methods=["GET"])
def get_isl_dictionary():
    """
    GET /api/sign/dictionary
    Returns the supported ISL vocabulary dictionary.
    """
    return jsonify({
        "success": True,
        "language": "ISL",
        "phase": 1,
        "entries": list(gloss_mapper.dictionary.values())
    }), 200

@sign_bp.route("/sign/model-metrics", methods=["GET"])
def get_model_metrics():
    """
    GET /api/sign/model-metrics
    Returns trained CNN-LSTM model status, validation accuracy, precision, recall, and F1-score.
    """
    metrics = recognition_engine.get_model_metrics()
    return jsonify({
        "success": True,
        "metrics": metrics
    }), 200

@sign_bp.route("/sign/recognize-continuous", methods=["POST"])
def recognize_continuous_sentence():
    """
    POST /api/sign/recognize-continuous
    Decodes a continuous multi-sign stream (CTC-style duplicate suppression)
    into a complete grammatically natural sentence across all 9 languages.
    Body: {"gloss_stream": ["I", "NEED", "DOCTOR", "HELP"], "target_lang": "en"}
    """
    data = request.get_json(force=True, silent=True) or {}
    raw_stream = data.get("gloss_stream", [])
    target_lang = data.get("target_lang", "en")

    decoded_glosses = recognition_engine.recognize_continuous_stream(raw_stream)
    sentence_res = sentence_service.generate_sentence(decoded_glosses, target_lang=target_lang)
    generated_text = sentence_res["text"]
    tts_res = tts_service.synthesize(generated_text, language=target_lang)

    multilingual_preview = {}
    for lang_code in ["en", "ta", "hi", "te", "ml", "kn", "mr", "bn", "gu"]:
        multilingual_preview[lang_code] = sentence_service.generate_sentence(decoded_glosses, target_lang=lang_code)["text"]

    return jsonify({
        "success": True,
        "raw_stream": raw_stream,
        "decoded_glosses": decoded_glosses,
        "sign_count": len(decoded_glosses),
        "target_lang": target_lang,
        "generated_text": generated_text,
        "multilingual_translations": multilingual_preview,
        "audio": tts_res
    }), 200
