import os
import io

SR_AVAILABLE = False
try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    pass

class SpeechRecognitionService:
    """
    Handles speech recognition across English (en), Tamil (ta), and Hindi (hi).
    Supports microphone audio files and base64 audio streams.
    """
    def __init__(self):
        self.recognizer = sr.Recognizer() if SR_AVAILABLE else None
        # Language codes for speech recognition engines
        self.lang_codes = {
            "en": "en-IN",
            "ta": "ta-IN",
            "hi": "hi-IN",
            "te": "te-IN",
            "ml": "ml-IN",
            "kn": "kn-IN",
            "mr": "mr-IN",
            "bn": "bn-IN",
            "gu": "gu-IN"
        }

    def transcribe_audio_file(self, file_path, language="en"):
        """
        Transcribes an audio file into text.
        Args:
            file_path: Absolute path to the audio file (WAV preferred).
            language: 'en', 'ta', or 'hi'
        Returns:
            dict: {"text": str, "language": str, "success": bool, "error": str}
        """
        if not SR_AVAILABLE or self.recognizer is None:
            return {
                "text": "",
                "language": language,
                "success": False,
                "error": "SpeechRecognition library not installed or initialized on backend."
            }

        target_lang = self.lang_codes.get(language, "en-US")

        if not os.path.exists(file_path):
            return {
                "text": "",
                "language": language,
                "success": False,
                "error": f"Audio file not found at {file_path}"
            }

        try:
            with sr.AudioFile(file_path) as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.3)
                audio_data = self.recognizer.record(source)

            # Recognize using Google Web Speech API (free client endpoint in speech_recognition)
            recognized_text = self.recognizer.recognize_google(audio_data, language=target_lang)
            return {
                "text": recognized_text,
                "language": language,
                "success": True,
                "error": None
            }
        except sr.UnknownValueError:
            return {
                "text": "",
                "language": language,
                "success": False,
                "error": "No clear speech detected in audio. Please speak closer to microphone."
            }
        except sr.RequestError as e:
            return {
                "text": "",
                "language": language,
                "success": False,
                "error": f"Speech recognition service request error: {str(e)}"
            }
        except Exception as e:
            return {
                "text": "",
                "language": language,
                "success": False,
                "error": f"Unexpected speech recognition failure: {str(e)}"
            }

    def process_transcription_text(self, text, language="en"):
        """
        Normalizes transcribed text and prepares it for NLP/gloss mapping.
        """
        if not text:
            return ""
        cleaned = text.strip()
        return cleaned
