import json
import os
from config import Config

DEEP_TRANSLATOR_AVAILABLE = False
try:
    from deep_translator import GoogleTranslator
    DEEP_TRANSLATOR_AVAILABLE = True
except ImportError:
    pass

class TranslationService:
    """
    Translates text between English (en) and 8 Indian Regional Languages:
    Tamil (ta), Hindi (hi), Telugu (te), Malayalam (ml), Kannada (kn),
    Marathi (mr), Bengali (bn), and Gujarati (gu).
    Includes online translation with fallback to the comprehensive ISL multilingual dictionary.
    """
    def __init__(self):
        self.offline_phrases = {
            "i need help": {
                "ta": "எனக்கு உதவி தேவை", "hi": "मुझे मदद चाहिए",
                "te": "నాకు సహాయం కావాలి", "ml": "എനിക്ക് സഹായം വേണം",
                "kn": "ನನಗೆ ಸಹಾಯ ಬೇಕು", "mr": "मला मदत हवी आहे",
                "bn": "আমার সাহায্য দরকার", "gu": "મને મદદ જોઈએ છે"
            },
            "water please": {
                "ta": "தயவுசெய்து தண்ணீர் கொடுங்கள்", "hi": "कृपया पानी दीजिए",
                "te": "దయచేసి నీరు ఇవ్వండి", "ml": "ദയവായി വെള്ളം തരൂ",
                "kn": "ದಯವಿಟ್ಟು ನೀರು ಕೊಡಿ", "mr": "कृपया पाणी द्या",
                "bn": "দয়া করে জল দিন", "gu": "કૃપા કરીને પાણી આપો"
            },
            "how are you": {
                "ta": "நீங்கள் எப்படி இருக்கிறீர்கள்", "hi": "आप कैसे हैं",
                "te": "మీరు ఎలా ఉన్నారు", "ml": "സുഖമാണോ",
                "kn": "ನೀವು ಹೇಗಿದ್ದೀರಿ", "mr": "तुम्ही कसे आहात",
                "bn": "আপনি কেমন আছেন", "gu": "તમે કેમ છો"
            },
            "i understand": {
                "ta": "எனக்கு புரிகிறது", "hi": "मैं समझ गया",
                "te": "నాకు అర్థమైంది", "ml": "എനിക്ക് മനസ്സിലായി",
                "kn": "ನನಗೆ ಅರ್ಥವಾಯಿತು", "mr": "मला समजले",
                "bn": "আমি বুঝতে পেরেছি", "gu": "હું સમજી ગયો"
            }
        }

        # Load all 74 entries and their 8 regional translations from isl_dictionary.json
        if os.path.exists(Config.ISL_DICTIONARY_PATH):
            try:
                with open(Config.ISL_DICTIONARY_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for entry in data.get("entries", []):
                        w = entry["word"].lower().strip()
                        trans = entry.get("translations", {})
                        if w not in self.offline_phrases:
                            self.offline_phrases[w] = trans
                        for syn in entry.get("synonyms", []):
                            s_key = syn.lower().strip()
                            if s_key not in self.offline_phrases:
                                self.offline_phrases[s_key] = trans
            except Exception as e:
                print(f"[Translation] Warning loading dictionary phrases: {e}")

        # Build reverse index for all regional languages back to English & other languages
        self.reverse_index = {}
        for en_key, trans in self.offline_phrases.items():
            for lang_code, regional_val in trans.items():
                if regional_val:
                    r_key = regional_val.strip().lower()
                    if r_key not in self.reverse_index:
                        self.reverse_index[r_key] = {"en": en_key, **trans}

    def translate(self, text, source_lang="en", target_lang="en"):
        """
        Translates text from source_lang to target_lang.
        Supported langs: 'en', 'ta', 'hi', 'te', 'ml', 'kn', 'mr', 'bn', 'gu'
        """
        if not text:
            return {"original_text": "", "translated_text": "", "source_lang": source_lang, "target_lang": target_lang, "engine": "none"}

        text = text.strip()
        if source_lang == target_lang:
            return {"original_text": text, "translated_text": text, "source_lang": source_lang, "target_lang": target_lang, "engine": "identity"}

        normalized = text.lower().strip()

        # 1. Check direct match in offline dictionary first for instant response
        if source_lang == "en" and normalized in self.offline_phrases:
            res = self.offline_phrases[normalized].get(target_lang)
            if res:
                return {
                    "original_text": text,
                    "translated_text": res,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "engine": "offline_dictionary"
                }

        if normalized in self.reverse_index:
            res = self.reverse_index[normalized].get(target_lang)
            if res:
                return {
                    "original_text": text,
                    "translated_text": res,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "engine": "offline_dictionary"
                }

        # 2. Try online translation if available
        if DEEP_TRANSLATOR_AVAILABLE:
            try:
                translated = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
                if translated:
                    return {
                        "original_text": text,
                        "translated_text": translated,
                        "source_lang": source_lang,
                        "target_lang": target_lang,
                        "engine": "deep_translator"
                    }
            except Exception as e:
                print(f"[Translation] Online service unreachable ({e}). Using offline dictionary.")

        # 3. Word-by-word fallback
        words = normalized.split()
        translated_words = []
        for w in words:
            if source_lang == "en" and w in self.offline_phrases:
                translated_words.append(self.offline_phrases[w].get(target_lang, w))
            elif w in self.reverse_index:
                translated_words.append(self.reverse_index[w].get(target_lang, w))
            else:
                translated_words.append(w)

        return {
            "original_text": text,
            "translated_text": " ".join(translated_words),
            "source_lang": source_lang,
            "target_lang": target_lang,
            "engine": "offline_word_mapping"
        }
