import os
import io
import base64

GTTS_AVAILABLE = False
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    pass

class TextToSpeechService:
    """
    Synthesizes speech in Tamil (ta), English (en), and Hindi (hi).
    Generates base64-encoded audio for instant frontend streaming and playback.
    """
    def __init__(self):
        self.lang_codes = {
            "en": "en",
            "ta": "ta",
            "hi": "hi",
            "te": "te",
            "ml": "ml",
            "kn": "kn",
            "mr": "mr",
            "bn": "bn",
            "gu": "gu"
        }

    def synthesize(self, text, language="en"):
        """
        Synthesizes text into audio.
        Returns:
            dict: {
                "success": bool,
                "audio_base64": str (data URL),
                "format": "audio/mp3",
                "language": str,
                "engine": str,
                "text": str
            }
        """
        if not text:
            return {
                "success": False,
                "audio_base64": "",
                "format": "audio/mp3",
                "language": language,
                "engine": "none",
                "error": "Empty text provided for synthesis"
            }

        lang_code = self.lang_codes.get(language, "en")

        # 1. Try gTTS online synthesis
        if GTTS_AVAILABLE:
            try:
                tts = gTTS(text=text, lang=lang_code, slow=False)
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                fp.seek(0)
                b64_data = base64.b64encode(fp.read()).decode("utf-8")
                return {
                    "success": True,
                    "audio_base64": f"data:audio/mp3;base64,{b64_data}",
                    "format": "audio/mp3",
                    "language": language,
                    "engine": "gTTS",
                    "text": text
                }
            except Exception as e:
                print(f"[TTS] gTTS synthesis error: {e}. Falling back to browser Web Speech API parameters.")

        # 2. Fallback: return metadata for browser Web Speech API client synthesis
        return {
            "success": True,
            "audio_base64": "",
            "use_browser_tts": True,
            "format": "web_speech_api",
            "language": language,
            "engine": "browser_speech_synthesis",
            "text": text
        }
