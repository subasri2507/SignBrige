# SignBridge AI — API Documentation

This document describes all REST API endpoints for the SignBridge AI backend service (Default: `http://localhost:5000`).

---

## 1. System Health Check

### `GET /api/health`
Checks the service status.

**Response (200 OK):**
```json
{
  "phase": 1,
  "service": "SignBridge AI Backend",
  "sign_language": "ISL",
  "status": "healthy",
  "supported_spoken_languages": ["en", "ta", "hi"],
  "version": "1.0.0"
}
```

---

## 2. Speech APIs

### `POST /api/speech/transcribe`
Transcribes spoken audio into text or normalizes direct client speech.

**Request Form Data:**
- `audio`: Audio file (WAV/MP3/WEBM)
- `language`: `"en"` | `"ta"` | `"hi"`

*OR JSON Body:*
```json
{
  "text": "Hello, I need help",
  "language": "en"
}
```

**Response (200 OK):**
```json
{
  "language": "en",
  "source": "web_speech_api",
  "success": true,
  "text": "Hello, I need help"
}
```

---

### `POST /api/speech/translate`
Translates text between English, Tamil, and Hindi.

**Request Body:**
```json
{
  "text": "I need help",
  "source_lang": "en",
  "target_lang": "ta"
}
```

**Response (200 OK):**
```json
{
  "engine": "offline_dictionary",
  "original_text": "I need help",
  "source_lang": "en",
  "success": true,
  "target_lang": "ta",
  "translated_text": "எனக்கு உதவி தேவை"
}
```

---

### `POST /api/speech/synthesize`
Synthesizes spoken audio from text.

**Request Body:**
```json
{
  "text": "வணக்கம்",
  "language": "ta"
}
```

**Response (200 OK):**
```json
{
  "audio_base64": "data:audio/mp3;base64,...",
  "engine": "gTTS",
  "format": "audio/mp3",
  "language": "ta",
  "success": true,
  "text": "வணக்கம்"
}
```

---

## 3. Voice-to-Sign Pipeline

### `POST /api/voice/to-sign`
Transforms spoken/written input into an ISL gloss sequence and 3D avatar animation timeline.

**Request Body:**
```json
{
  "text": "I need help please",
  "spoken_language": "en"
}
```

**Response (200 OK):**
```json
{
  "avatar_sequence": {
    "ready_to_play": true,
    "timeline": [
      {
        "animation_id": "anim_i",
        "clip_name": "ISL_I",
        "description": "Index finger pointing directly toward center of own chest",
        "display_name": "I / Me",
        "duration": 1.5,
        "gloss": "I",
        "is_supported": true,
        "start_time": 0.0
      },
      {
        "animation_id": "anim_help",
        "clip_name": "ISL_Help",
        "duration": 2.0,
        "gloss": "HELP",
        "is_supported": true,
        "start_time": 1.8
      },
      {
        "animation_id": "anim_please",
        "clip_name": "ISL_Please",
        "duration": 2.0,
        "gloss": "PLEASE",
        "is_supported": true,
        "start_time": 4.1
      }
    ],
    "total_duration": 6.4,
    "unsupported": []
  },
  "gloss_sequence": ["I", "HELP", "PLEASE"],
  "has_unsupported": false,
  "input_text": "I need help please",
  "spoken_language": "en",
  "success": true,
  "supported_glosses": ["I", "HELP", "PLEASE"],
  "unsupported_words": [],
  "warning_message": null
}
```

---

## 4. Sign Recognition APIs

### `POST /api/sign/recognize`
Classifies ISL sign from MediaPipe hand and pose coordinates.

**Request Body:**
```json
{
  "left_hand": [ {"x": 0.45, "y": 0.50, "z": -0.02}, ... ],
  "right_hand": [ {"x": 0.55, "y": 0.50, "z": -0.02}, ... ],
  "sequence": [ ... ]
}
```

**Response (200 OK):**
```json
{
  "alternatives": ["HELLO", "WELCOME"],
  "confidence": 0.92,
  "confidence_evaluation": {
    "action": "ACCEPT",
    "color": "emerald",
    "level": "HIGH",
    "score": 0.92,
    "user_guidance": "High confidence match. Recognition accepted."
  },
  "engine": "landmark_baseline",
  "gloss": "NAMASTE",
  "is_trained_model": false,
  "status": "high_confidence",
  "success": true
}
```

---

### `POST /api/sign/to-speech`
End-to-end pipeline: Recognized ISL Glosses -> Spoken Text -> TTS Audio.

**Request Body:**
```json
{
  "glosses": ["WATER", "PLEASE"],
  "target_lang": "hi"
}
```

**Response (200 OK):**
```json
{
  "audio": {
    "audio_base64": "data:audio/mp3;base64,...",
    "engine": "gTTS",
    "language": "hi",
    "success": true
  },
  "generated_text": "कृपया मुझे पानी दीजिए।",
  "glosses": ["WATER", "PLEASE"],
  "is_template_match": true,
  "success": true,
  "target_lang": "hi"
}
```

---

## 5. Conversations & History

- `GET /api/conversations`: List all conversation sessions.
- `POST /api/conversations`: Create a new session (`{"title": "Morning Class"}`).
- `GET /api/conversations/<id>/messages`: Get full message history with glosses and timestamps.
- `POST /api/conversations/<id>/messages`: Add message.
- `DELETE /api/conversations/<id>`: Delete conversation.
- `DELETE /api/conversations/clear-all`: Clear entire history.
- `POST /api/sign/correct`: Submit user correction for a sign.

---

## 6. Avatar APIs

- `GET /api/avatar/animations`: Lists all 20 supported ISL signs and animation keyframe coordinates.
- `POST /api/avatar/play-sequence`: Returns full timed sequence for requested glosses.

---

## 7. Settings APIs

- `GET /api/settings`: Returns user preferences and fixed ISL configuration.
- `PUT /api/settings`: Updates preferences (default language, TTS speed, threshold).
