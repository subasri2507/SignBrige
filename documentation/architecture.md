# SignBridge AI — System Architecture (Phase 1)

## 1. System Overview

**SignBridge AI** is an AI-based bidirectional communication system designed for seamless, real-time interaction between hearing individuals and deaf or non-speaking individuals. Phase 1 focuses strictly on **Indian Sign Language (ISL)** with multilingual spoken support for **English**, **Tamil**, and **Hindi**.

---

## 2. Bidirectional Communication Workflows

### Direction A: Hearing Person → Deaf/Non-Speaking Person

```
[Spoken Voice (Microphone)]
         │
         ▼
[Speech Recognition (Whisper / Web Speech Engine)]
         │
         ▼
[Multilingual Translation (Tamil/Hindi -> English Semantic Interlingua)]
         │
         ▼
[ISL Gloss Mapping Engine (Stop-word filtering & SOV Alignment)]
         │
         ▼
[3D Avatar Sequential Controller]
         │
         ▼
[Three.js / React Three Fiber Animated 3D Avatar Rendering]
```

1. **Voice Capture:** Captured via browser Web Speech API or streamed as WAV/MP3 to the Flask backend.
2. **Speech Recognition:** Transcribes speech in English, Tamil, or Hindi.
3. **Translation:** Translates sentences into English semantic representations for ISL mapping when needed.
4. **ISL Gloss Mapping:** Applies ISL grammatical syntax (omits copulas/articles like *is, are, the, a*), matches multi-word phrases and lemmas, and highlights any unsupported vocabulary clearly without silent omission.
5. **Avatar Sequence Orchestration:** Builds a sequential animation timeline with keyframes, durations, and smooth transitions.
6. **3D Avatar Visualization:** Three.js and React Three Fiber render the 3D humanoid avatar executing the signs.

---

### Direction B: Deaf/Non-Speaking Person → Hearing Person

```
[Webcam Video Stream (User Signing)]
         │
         ▼
[OpenCV Frame Preprocessing]
         │
         ▼
[MediaPipe Holistic / Hands & Pose Landmark Extraction (126 Features)]
         │
         ▼
[ISL Recognition Engine (Trained CNN-LSTM / Geometric Landmark Baseline)]
         │
         ▼
[Confidence Scoring & Threshold Evaluation (High/Medium/Low)]
         │
         ▼
[Sentence Generation (Natural Template Alignment)]
         │
         ▼
[Spoken Translation (English -> Tamil / Hindi)]
         │
         ▼
[Text-to-Speech Synthesis (gTTS / Web Speech API)]
```

1. **Webcam Capture:** High-frame-rate video capture in the browser with canvas landmark overlay.
2. **Landmark Extraction:** MediaPipe extracts 21 coordinates for Left Hand, 21 for Right Hand, and 33 for Pose.
3. **ISL Recognition Engine:**
   - Deep Learning: 1D Temporal CNN + Bidirectional LSTM processing temporal sequences of 30 frames x 126 coordinates.
   - Heuristic Baseline: High-precision geometric finger-flexion and palm proximity analyzer for immediate zero-dependency recognition of supported ISL signs.
4. **Confidence Evaluation:** Evaluates recognition confidence against configured thresholds (High: $\ge 0.75$, Medium: $\ge 0.50$, Low: $< 0.50$).
5. **Sentence Generation:** Assembles recognized glosses into natural spoken sentences.
6. **Translation & TTS:** Translates generated sentences into the selected spoken language (Tamil, English, Hindi) and synthesizes audio.

---

## 3. Technology Stack Details

- **Frontend:** React 18, Vite, Tailwind CSS, React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`), Lucide React icons, Axios.
- **Backend:** Python 3, Flask, Flask-CORS, SQLAlchemy ORM.
- **Computer Vision & AI:** OpenCV, MediaPipe, NumPy, PyTorch / CNN-LSTM model architecture.
- **Database:** SQLite with SQLAlchemy ORM (`signbridge.db`).
- **3D Graphics:** Three.js procedural skeletal avatar and GLTF/GLB loader.
