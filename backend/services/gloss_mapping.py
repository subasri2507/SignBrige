import json
import os
import re
from config import Config

class ISLGlossMapper:
    """
    Indian Sign Language (ISL) Gloss Mapping Service.
    Transforms spoken language sentences (English, Tamil, Hindi, Telugu, Malayalam,
    Kannada, Marathi, Bengali, Gujarati) into ISL gloss sequences.
    Filters grammatical stop-words as per ISL syntax, maps synonyms & inflections,
    and flags unsupported words with clear warnings.
    """
    def __init__(self, dictionary_path=None):
        self.dictionary_path = dictionary_path or Config.ISL_DICTIONARY_PATH
        self.dictionary = {}
        self.entries_list = []
        self.stop_words = {
            "a", "an", "the", "is", "am", "are", "was", "were", "be", "been", "being",
            "do", "does", "did", "to", "at", "by", "for", "with", "about", "against",
            "between", "into", "through", "during", "before", "after", "above", "below",
            "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
            "further", "then", "once", "here", "there", "all", "any", "both", "each",
            "few", "more", "most", "other", "some", "such", "of", "and", "or", "but",
            "will", "shall", "can", "could", "would", "should", "have", "has", "had",
            "may", "might", "must", "very", "really", "just", "so", "too"
        }
        self._load_dictionary()

    def _load_dictionary(self):
        if os.path.exists(self.dictionary_path):
            try:
                with open(self.dictionary_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.entries_list = data.get("entries", [])
                    for item in self.entries_list:
                        word_key = item["word"].lower().strip()
                        self.dictionary[word_key] = item
                        self.dictionary[item["gloss"].lower().strip()] = item
                        self.dictionary[item["gloss"].lower().replace("_", " ").strip()] = item

                        # Index all synonyms
                        for syn in item.get("synonyms", []):
                            if syn:
                                self.dictionary[syn.lower().strip()] = item

                        # Index all Indian regional language translations
                        translations = item.get("translations", {})
                        for lang, trans_text in translations.items():
                            if trans_text:
                                self.dictionary[trans_text.strip().lower()] = item
            except Exception as e:
                print(f"[GlossMapper] Warning loading ISL dictionary: {e}")

    def _lookup_word(self, w):
        """Looks up a word or its common stem in the ISL dictionary."""
        if w in self.dictionary:
            return self.dictionary[w]
        # Simple morphological stemming for English plurals / tenses
        if len(w) > 4:
            if w.endswith("ing") and w[:-3] in self.dictionary:
                return self.dictionary[w[:-3]]
            if w.endswith("ing") and (w[:-3] + "e") in self.dictionary:
                return self.dictionary[w[:-3] + "e"]
            if w.endswith("ed") and w[:-2] in self.dictionary:
                return self.dictionary[w[:-2]]
            if w.endswith("ed") and w[:-1] in self.dictionary:
                return self.dictionary[w[:-1]]
            if w.endswith("es") and w[:-2] in self.dictionary:
                return self.dictionary[w[:-2]]
        if len(w) > 3 and w.endswith("s") and w[:-1] in self.dictionary:
            return self.dictionary[w[:-1]]
        return None

    def map_sentence(self, sentence, language="en"):
        """
        Maps a spoken sentence into an ISL gloss representation.
        """
        if not sentence:
            return {
                "original_sentence": "",
                "language": language,
                "tokens": [],
                "gloss_sequence": [],
                "supported_glosses": [],
                "unsupported_words": [],
                "animation_sequence": [],
                "has_unsupported": False,
                "warning_message": None
            }

        # Normalize sentence preserving Indian scripts (Tamil, Devanagari, Telugu, Malayalam, Kannada, Bengali, Gujarati)
        cleaned = re.sub(r"[^\w\s\u0900-\u0D7F]", "", sentence.lower().strip())
        words = cleaned.split()

        tokens = []
        gloss_sequence = []
        supported_glosses = []
        full_sign_sequence = []
        fingerspelled_words = []
        unsupported_words = []
        animation_sequence = []

        idx = 0
        while idx < len(words):
            matched = False
            # Check 3-word phrase
            if idx + 2 < len(words):
                phrase3 = f"{words[idx]} {words[idx+1]} {words[idx+2]}"
                if phrase3 in self.dictionary:
                    entry = self.dictionary[phrase3]
                    gloss = entry["gloss"]
                    tokens.append({
                        "original": phrase3,
                        "gloss": gloss,
                        "is_supported": entry["is_supported"],
                        "animation_id": entry.get("animation_id"),
                        "description": entry.get("description")
                    })
                    gloss_sequence.append(gloss)
                    if entry["is_supported"]:
                        supported_glosses.append(gloss)
                        full_sign_sequence.append(gloss)
                        if entry.get("animation_id"):
                            animation_sequence.append(entry["animation_id"])
                    idx += 3
                    matched = True

            # Check 2-word phrase
            if not matched and idx + 1 < len(words):
                phrase2 = f"{words[idx]} {words[idx+1]}"
                if phrase2 in self.dictionary:
                    entry = self.dictionary[phrase2]
                    gloss = entry["gloss"]
                    tokens.append({
                        "original": phrase2,
                        "gloss": gloss,
                        "is_supported": entry["is_supported"],
                        "animation_id": entry.get("animation_id"),
                        "description": entry.get("description")
                    })
                    gloss_sequence.append(gloss)
                    if entry["is_supported"]:
                        supported_glosses.append(gloss)
                        full_sign_sequence.append(gloss)
                        if entry.get("animation_id"):
                            animation_sequence.append(entry["animation_id"])
                    idx += 2
                    matched = True

            if not matched:
                w = words[idx]
                entry = self._lookup_word(w)

                # Filter out English grammatical stop-words ONLY if not a core dictionary word
                if entry is None and language == "en" and w in self.stop_words:
                    tokens.append({
                        "original": w,
                        "gloss": None,
                        "is_supported": False,
                        "omitted_as_filler": True,
                        "reason": "Omitted in ISL syntax (grammatical filler/copula)"
                    })
                    idx += 1
                    continue

                if entry is not None:
                    gloss = entry["gloss"]
                    tokens.append({
                        "original": w,
                        "gloss": gloss,
                        "is_supported": entry["is_supported"],
                        "animation_id": entry.get("animation_id"),
                        "description": entry.get("description")
                    })
                    gloss_sequence.append(gloss)
                    if entry["is_supported"]:
                        supported_glosses.append(gloss)
                        full_sign_sequence.append(gloss)
                        if entry.get("animation_id"):
                            animation_sequence.append(entry["animation_id"])
                else:
                    spell_gloss = f"SPELL:{w.upper()}"
                    tokens.append({
                        "original": w,
                        "gloss": spell_gloss,
                        "is_supported": False,
                        "is_fingerspelled": True,
                        "letters": list(re.sub(r"[^A-Z0-9]", "", w.upper())),
                        "animation_id": f"anim_spell_{w.lower()}",
                        "reason": "Signed via ISL Alphabetical Fingerspelling (A-Z)"
                    })
                    unsupported_words.append(w)
                    fingerspelled_words.append(w)
                    gloss_sequence.append(spell_gloss)
                    full_sign_sequence.append(spell_gloss)

                idx += 1

        has_unsupported = len(unsupported_words) > 0
        warning_msg = None
        if has_unsupported:
            warning_msg = (
                f"Words [{', '.join(unsupported_words)}] are outside the 74-sign core lexicon "
                f"and are automatically signed using ISL Alphabetical Fingerspelling (SPELL:A-Z)."
            )

        return {
            "original_sentence": sentence,
            "language": language,
            "tokens": tokens,
            "gloss_sequence": gloss_sequence,
            "supported_glosses": supported_glosses,
            "full_sign_sequence": full_sign_sequence,
            "fingerspelled_words": fingerspelled_words,
            "unsupported_words": unsupported_words,
            "animation_sequence": animation_sequence,
            "has_unsupported": has_unsupported,
            "warning_message": warning_msg
        }
