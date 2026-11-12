import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from services.speech_recognition import SpeechRecognitionService
from services.translation import TranslationService
from services.text_to_speech import TextToSpeechService
from config import Config

speech_bp = Blueprint("speech", __name__, url_prefix="/api/speech")

speech_service = SpeechRecognitionService()
translation_service = TranslationService()
tts_service = TextToSpeechService()

@speech_bp.route("/transcribe", methods=["POST"])
def transcribe_audio():
    """
    POST /api/speech/transcribe
    Transcribes uploaded audio file or direct text payload.
    Expected: multipart/form-data with 'audio' file or JSON with 'text' and 'language'
    """
    language = request.form.get("language") or (request.json and request.json.get("language")) or "en"
    
    # 1. Direct text submission (from browser speech recognition)
    if request.is_json and request.json.get("text"):
        raw_text = request.json.get("text")
        cleaned_text = speech_service.process_transcription_text(raw_text, language)
        return jsonify({
            "success": True,
            "text": cleaned_text,
            "language": language,
            "source": "web_speech_api"
        }), 200

    # 2. Audio file upload
    if "audio" not in request.files:
        return jsonify({
            "success": False,
            "error": "No audio file or text provided in request",
            "text": ""
        }), 400

    file = request.files["audio"]
    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "Empty audio file uploaded",
            "text": ""
        }), 400

    filename = secure_filename(f"temp_audio_{file.filename}")
    save_path = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(save_path)

    try:
        result = speech_service.transcribe_audio_file(save_path, language=language)
        return jsonify(result), (200 if result["success"] else 422)
    finally:
        if os.path.exists(save_path):
            try:
                os.remove(save_path)
            except Exception:
                pass

@speech_bp.route("/translate", methods=["POST"])
def translate_text():
    """
    POST /api/speech/translate
    Translates text between English, Tamil, and Hindi.
    Body: {"text": str, "source_lang": str, "target_lang": str}
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    source_lang = data.get("source_lang", "en")
    target_lang = data.get("target_lang", "en")

    if not text:
        return jsonify({
            "success": False,
            "error": "Field 'text' is required"
        }), 400

    result = translation_service.translate(text, source_lang=source_lang, target_lang=target_lang)
    return jsonify({
        "success": True,
        **result
    }), 200

@speech_bp.route("/synthesize", methods=["POST"])
def synthesize_speech():
    """
    POST /api/speech/synthesize
    Converts text to speech audio.
    Body: {"text": str, "language": str}
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    language = data.get("language", "en")

    if not text:
        return jsonify({
            "success": False,
            "error": "Field 'text' is required"
        }), 400

    result = tts_service.synthesize(text, language=language)
    return jsonify(result), 200
