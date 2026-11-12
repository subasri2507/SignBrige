import json
import os
from config import Config

class SentenceGenerationService:
    """
    Transforms recognized ISL gloss sequences into natural, grammatically fluent sentences
    across English and 8 Indian Regional Languages (Tamil, Hindi, Telugu, Malayalam,
    Kannada, Marathi, Bengali, Gujarati).
    """
    def __init__(self):
        self.templates = {
            ("NAMASTE",): {
                "en": "Hello, greetings!", "ta": "வணக்கம்!", "hi": "नमस्ते, अभिवादन!",
                "te": "నమస్కారం!", "ml": "നമസ്കാരം!", "kn": "ನಮಸ್ಕಾರ!", "mr": "नमस्कार!", "bn": "নমস্কার!", "gu": "નમસ્તે!"
            },
            ("HELLO",): {
                "en": "Hello!", "ta": "வணக்கம்!", "hi": "नमस्ते!",
                "te": "హలో!", "ml": "ഹലോ!", "kn": "ಹಲೋ!", "mr": "हॅलो!", "bn": "হ্যালো!", "gu": "હેલો!"
            },
            ("HELP",): {
                "en": "I need help.", "ta": "எனக்கு உதவி தேவை.", "hi": "मुझे मदद चाहिए।",
                "te": "నాకు సహాయం కావాలి.", "ml": "എനിക്ക് സഹായം വേണം.", "kn": "ನನಗೆ ಸಹಾಯ ಬೇಕು.",
                "mr": "मला मदत हवी आहे.", "bn": "আমার সাহায্য দরকার।", "gu": "મને મદદ જોઈએ છે."
            },
            ("I", "HELP"): {
                "en": "I need help.", "ta": "எனக்கு உதவி தேவை.", "hi": "मुझे मदद चाहिए।",
                "te": "నాకు సహాయం కావాలి.", "ml": "എനിക്ക് സഹായം വേണം.", "kn": "ನನಗೆ ಸಹಾಯ ಬೇಕು.",
                "mr": "मला मदत हवी आहे.", "bn": "আমার সাহায্য দরকার।", "gu": "મને મદદ જોઈએ છે."
            },
            ("HELP", "PLEASE"): {
                "en": "Please help me.", "ta": "தயவுசெய்து எனக்கு உதவுங்கள்.", "hi": "कृपया मेरी मदद करें।",
                "te": "దయచేసి నాకు సహాయం చేయండి.", "ml": "ദയവായി എന്നെ സഹായിക്കൂ.", "kn": "ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ.",
                "mr": "कृपया मला मदत करा.", "bn": "দয়া করে আমাকে সাহায্য করুন।", "gu": "કૃપા કરીને મને મદદ કરો."
            },
            ("WATER",): {
                "en": "I need water.", "ta": "எனக்கு தண்ணீர் வேண்டும்.", "hi": "मुझे पानी चाहिए।",
                "te": "నాకు నీరు కావాలి.", "ml": "എനിക്ക് വെള്ളം വേണം.", "kn": "ನನಗೆ ನೀರು ಬೇಕು.",
                "mr": "मला पाणी हवे आहे.", "bn": "আমার জল চাই।", "gu": "મને પાણી જોઈએ છે."
            },
            ("WATER", "PLEASE"): {
                "en": "Please give me water.", "ta": "தயவுசெய்து தண்ணீர் கொடுங்கள்.", "hi": "कृपया मुझे पानी दीजिए।",
                "te": "దయచేసి నాకు నీరు ఇవ్వండి.", "ml": "ദയവായി എനിക്ക് വെള്ളം തരൂ.", "kn": "ದಯವಿಟ್ಟು ನನಗೆ ನೀರು ಕೊಡಿ.",
                "mr": "कृपया मला पाणी द्या.", "bn": "দয়া করে আমাকে জল দিন।", "gu": "કૃપા કરીને મને પાણી આપો."
            },
            ("THANK_YOU",): {
                "en": "Thank you very much.", "ta": "மிக்க நன்றி.", "hi": "आपका बहुत धन्यवाद।",
                "te": "చాలా ధన్యవాదాలు.", "ml": "വളരെ നന്ദി.", "kn": "ತುಂಬಾ ಧನ್ಯವಾದಗಳು.",
                "mr": "खूप धन्यवाद.", "bn": "অনেক ধন্যবাদ।", "gu": "ખૂબ ખૂબ આભાર."
            },
            ("YES",): {
                "en": "Yes, I agree.", "ta": "ஆம், நான் ஒப்புக்கொள்கிறேன்.", "hi": "हाँ, मैं सहमत हूँ।",
                "te": "అవును, నేను అంగీకరిస్తున్నాను.", "ml": "അതെ, ഞാൻ യോജിക്കുന്നു.", "kn": "ಹೌದು, ನಾನು ಒಪ್ಪುತ್ತೇನೆ.",
                "mr": "होय, मी सहमत आहे.", "bn": "হ্যাঁ, আমি একমত।", "gu": "હા, હું સંમત છું."
            },
            ("NO",): {
                "en": "No.", "ta": "இல்லை.", "hi": "नहीं।",
                "te": "కాదు.", "ml": "ഇല്ല.", "kn": "ಇಲ್ಲ.", "mr": "नाही.", "bn": "না।", "gu": "ના."
            },
            ("GOOD",): {
                "en": "This is good.", "ta": "இது நல்லது.", "hi": "यह अच्छा है।",
                "te": "ఇది మంచిది.", "ml": "ഇത് നല്ലതാണ്.", "kn": "ಇದು ಒಳ್ಳೆಯದು.", "mr": "हे चांगले आहे.", "bn": "এটি ভালো।", "gu": "આ સારું છે."
            },
            ("BAD",): {
                "en": "This is not good.", "ta": "இது நல்லதல்ல.", "hi": "यह अच्छा नहीं है।",
                "te": "ఇది మంచిది కాదు.", "ml": "ഇത് നല്ലതല്ല.", "kn": "ಇದು ಒಳ್ಳೆಯದಲ್ಲ.", "mr": "हे चांगले नाही.", "bn": "এটি ভালো নয়।", "gu": "આ સારું નથી."
            },
            ("PLEASE",): {
                "en": "Please.", "ta": "தயவுசெய்து.", "hi": "कृपया।",
                "te": "దయచేసి.", "ml": "ദയവായി.", "kn": "ದಯವಿಟ್ಟು.", "mr": "कृपया.", "bn": "দয়া করে।", "gu": "કૃપા કરીને."
            },
            ("SORRY",): {
                "en": "I am sorry.", "ta": "மன்னிக்கவும்.", "hi": "मुझे माफ़ कीजिए।",
                "te": "క్షమించండి.", "ml": "ക്ഷമിക്കണം.", "kn": "ಕ್ಷಮಿಸಿ.", "mr": "क्षमस्व.", "bn": "আমি দুঃখিত।", "gu": "મને માફ કરશો."
            },
            ("RESTROOM",): {
                "en": "Where is the restroom?", "ta": "கழிப்பறை எங்கே உள்ளது?", "hi": "शौचालय कहाँ है?",
                "te": "మరుగుదొడ్డి ఎక్కడ ఉంది?", "ml": "ശৌചാലയം എവിടെയാണ്?", "kn": "ಶೌಚಾಲಯ ಎಲ್ಲಿದೆ?",
                "mr": "स्वच्छतागृह कुठे आहे?", "bn": "শৌচাগার কোথায়?", "gu": "શૌચાલય ક્યાં છે?"
            },
            ("FOOD",): {
                "en": "I need food.", "ta": "எனக்கு உணவு வேண்டும்.", "hi": "मुझे खाना चाहिए।",
                "te": "నాకు ఆహారం కావాలి.", "ml": "എനിക്ക് ഭക്ഷണം വേണം.", "kn": "ನನಗೆ ಊಟ ಬೇಕು.",
                "mr": "मला जेवण हवे आहे.", "bn": "আমার খাবার চাই।", "gu": "મને ખોરાક જોઈએ છે."
            },
            ("WELCOME",): {
                "en": "You are welcome.", "ta": "வரவேற்கிறோம்.", "hi": "आपका स्वागत है।",
                "te": "మీకు స్వాగతం.", "ml": "സ്വാഗതം.", "kn": "ನಿಮಗೆ ಸ್ವಾಗತ.", "mr": "तुमचे स्वागत आहे.", "bn": "স্বাগতম।", "gu": "તમારું સ્વાગત છે."
            },
            ("STOP",): {
                "en": "Please stop.", "ta": "தயவுசெய்து நில்லுங்கள்.", "hi": "कृपया रुकिए।",
                "te": "దయచేసి ఆగండి.", "ml": "ദയവായി നിർത്തുക.", "kn": "ದಯವಿಟ್ಟು ನಿಲ್ಲಿಸಿ.", "mr": "कृपया थांबा.", "bn": "দয়া করে থামুন।", "gu": "કૃપા કરીને થોભો."
            },
            ("UNDERSTAND",): {
                "en": "I understand.", "ta": "எனக்கு புரிகிறது.", "hi": "मैं समझ गया।",
                "te": "నాకు అర్థమైంది.", "ml": "എനിക്ക് മനസ്സിലായി.", "kn": "ನನಗೆ ಅರ್ಥವಾಯಿತು.", "mr": "मला समजले.", "bn": "আমি বুঝতে পেরেছি।", "gu": "હું સમજી ગયો."
            },
            ("TEACHER", "CLASSROOM"): {
                "en": "The teacher is in the classroom.", "ta": "ஆசிரியர் வகுப்பறையில் இருக்கிறார்.", "hi": "शिक्षक कक्षा में हैं।"
            },
            ("STUDENT", "CLASSROOM"): {
                "en": "The student is in the classroom.", "ta": "மாணவர் வகுப்பறையில் இருக்கிறார்.", "hi": "छात्र कक्षा में है।"
            }
        }

        # Dynamically load all 74 gloss word maps from isl_dictionary.json
        self.word_map = {}
        if os.path.exists(Config.ISL_DICTIONARY_PATH):
            try:
                with open(Config.ISL_DICTIONARY_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data.get("entries", []):
                        g = item["gloss"].upper()
                        self.word_map[g] = {"en": item["word"], **item.get("translations", {})}
            except Exception as e:
                print(f"[SentenceGen] Warning loading dictionary: {e}")

    def generate_sentence(self, gloss_list, target_lang="en"):
        if not gloss_list:
            return {
                "glosses": [],
                "target_lang": target_lang,
                "text": "",
                "is_template_match": False
            }

        clean_glosses = tuple(g.strip().upper() for g in gloss_list if g and g.strip().upper() != "UNKNOWN")

        if clean_glosses in self.templates:
            match = self.templates[clean_glosses]
            return {
                "glosses": list(clean_glosses),
                "target_lang": target_lang,
                "text": match.get(target_lang, match.get("en", " ".join(clean_glosses))),
                "is_template_match": True
            }

        if len(clean_glosses) == 1:
            single = (clean_glosses[0],)
            if single in self.templates:
                match = self.templates[single]
                return {
                    "glosses": list(clean_glosses),
                    "target_lang": target_lang,
                    "text": match.get(target_lang, match.get("en", clean_glosses[0])),
                    "is_template_match": True
                }

        generated_tokens = []
        for g in clean_glosses:
            if g in self.word_map:
                generated_tokens.append(self.word_map[g].get(target_lang, self.word_map[g].get("en", g.lower())))
            else:
                generated_tokens.append(g.lower().replace("_", " "))

        text = " ".join(generated_tokens)
        if text:
            text = text[0].upper() + text[1:] + "."

        return {
            "glosses": list(clean_glosses),
            "target_lang": target_lang,
            "text": text,
            "is_template_match": len(clean_glosses) == 1 and clean_glosses[0] in self.word_map
        }
