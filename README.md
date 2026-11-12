# SignBridge AI — Phase 1

**AI-Based Bidirectional Communication System for Hearing and Deaf/Non-Speaking People Using Indian Sign Language Recognition and 3D Avatar Translation.**

Suitable for an **M.E. Computer Science and Engineering Academic Project Demonstration**.

---

## 1. Project Introduction

Communication between hearing individuals and deaf or non-speaking communities remains a significant societal barrier in India. **SignBridge AI** bridges this communication divide through an end-to-end bidirectional, real-time multimodal web platform.

For Phase 1, the system is strictly focused on **Indian Sign Language (ISL)** with multilingual spoken support for **English**, **Tamil (தமிழ்)**, and **Hindi (हिन्दी)**.

---

## 2. Problem Statement

Existing assistive technologies exhibit key shortcomings:
1. **Unidirectional:** Most applications only convert speech to text or text to speech, failing to support expressive sign language signing.
2. **ASL/Western Bias:** Most available sign-language recognition software relies on American Sign Language (ASL) or British Sign Language (BSL), which are linguistically incompatible with Indian Sign Language (ISL).
3. **Lack of 3D Signing Avatars:** Conventional solutions display static pre-recorded video clips that cannot dynamically synthesize custom sentences.
4. **Language Exclusivity:** Non-English spoken languages prevalent in India (such as Tamil and Hindi) are rarely integrated directly with sign language interfaces.

---

## 3. Proposed System & Phase 1 Objectives

SignBridge AI delivers a complete, functional bidirectional communication architecture:

### Direction A: Hearing Person $\rightarrow$ Deaf / Non-Speaking Person
$$\text{Spoken Voice} \rightarrow \text{Speech Recognition} \rightarrow \text{NLP Translation} \rightarrow \text{ISL Gloss Mapping} \rightarrow \text{3D Avatar Animation}$$
- Supports Tamil, English, and Hindi voice input.
- Maps spoken syntax into ISL grammatical gloss structure (omits copulas/filler words like *is, are, the, a*).
- Animate an interactive 3D skeletal humanoid avatar using Three.js and React Three Fiber with pause, replay, and speed controls.
- Explicitly flags words outside the Phase 1 vocabulary without silent omission.

### Direction B: Deaf / Non-Speaking Person $\rightarrow$ Hearing Person
$$\text{Webcam Stream} \rightarrow \text{OpenCV / MediaPipe} \rightarrow \text{Landmarks (126-dim)} \rightarrow \text{ISL Classifier} \rightarrow \text{Sentence Generation} \rightarrow \text{Text-to-Speech}$$
- Real-time webcam capture with MediaPipe Holistic / Hands & Pose landmark extraction.
- Dual classification engine: Active geometric landmark baseline for zero-dependency instant recognition + modular CNN-LSTM temporal sequence loader.
- Generates natural sentences and translates into the listener's chosen language (Tamil, English, or Hindi).
- Synthesizes clear spoken audio via text-to-speech.

---

## 4. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React |
| **3D Graphics** | Three.js, React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`) |
| **Backend** | Python 3.10+, Flask, Flask-CORS, REST API, SQLAlchemy ORM |
| **AI & Computer Vision** | OpenCV, MediaPipe (Hands & Pose), NumPy, PyTorch (CNN-LSTM architecture) |
| **Speech & Audio** | Web Speech API, SpeechRecognition / Whisper, gTTS, browser synthesis |
| **Database** | SQLite 3 (`signbridge.db`) |

---

## 5. Complete Project Folder Structure

```
SignBridgeAI/
│
├── frontend/
│   ├── public/
│   │   ├── avatars/
│   │   ├── animations/
│   │   └── images/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SpeechInput.jsx
│   │   │   ├── WebcamCapture.jsx
│   │   │   ├── AvatarViewer.jsx
│   │   │   ├── SubtitleDisplay.jsx
│   │   │   ├── ConfidenceDisplay.jsx
│   │   │   └── MessageBubble.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── VoiceToSign.jsx
│   │   │   ├── SignToSpeech.jsx
│   │   │   ├── ClassroomMode.jsx
│   │   │   ├── History.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   │   ├── useWebcam.js
│   │   │   └── useSpeechRecognition.js
│   │   ├── config/
│   │   │   └── islConfig.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── speech_routes.py
│   │   ├── sign_routes.py
│   │   ├── video_routes.py
│   │   ├── avatar_routes.py
│   │   ├── conversation_routes.py
│   │   └── settings_routes.py
│   ├── services/
│   │   ├── speech_recognition.py
│   │   ├── translation.py
│   │   ├── text_to_speech.py
│   │   ├── gloss_mapping.py
│   │   ├── sentence_generation.py
│   │   └── confidence.py
│   ├── isl/
│   │   ├── isl_dictionary.json
│   │   ├── isl_recognition.py
│   │   └── isl_config.json
│   ├── models/
│   │   └── cnn_lstm.py
│   ├── avatar/
│   │   ├── animation_mapper.py
│   │   └── avatar_controller.py
│   ├── database/
│   │   ├── db.py
│   │   └── models.py
│   └── utils/
│       ├── video_processing.py
│       └── landmark_extraction.py
│
├── datasets/
│   └── isl/
│       ├── videos/
│       ├── landmarks/
│       └── labels/
│
├── training/
│   ├── preprocessing.py
│   ├── train_cnn_lstm.py
│   └── evaluate_model.py
│
├── documentation/
│   ├── architecture.md
│   ├── api_documentation.md
│   ├── dataset_guide.md
│   └── installation_guide.md
│
├── tests/
│   ├── test_speech.py
│   ├── test_sign.py
│   ├── test_translation.py
│   ├── test_database.py
│   └── test_api.py
│
├── .env.example
├── .gitignore
├── README.md
├── start_project.bat
└── requirements.txt
```

---

## 6. Supported ISL Phase 1 Vocabulary

Phase 1 provides a clearly documented, limited core ISL vocabulary:

| # | ISL Gloss | Category | English Equivalent | Tamil (தமிழ்) | Hindi (हिन्दी) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `NAMASTE` | Greeting | Hello / Greetings | வணக்கம் | नमस्ते |
| 2 | `HELLO` | Greeting | Hello | வணக்கம் | नमस्ते |
| 3 | `HELP` | Emergency | Help / Assistance | உதவி | मदद |
| 4 | `WATER` | Daily Need | Water | தண்ணீர் | पानी |
| 5 | `THANK_YOU` | Courtesy | Thank You / Thanks | நன்றி | धन्यवाद |
| 6 | `YES` | Response | Yes | ஆம் | हाँ |
| 7 | `NO` | Response | No | இல்லை | नहीं |
| 8 | `I` | Pronoun | I / Me | நான் | मैं |
| 9 | `YOU` | Pronoun | You | நீங்கள் | आप |
| 10 | `GOOD` | Evaluation | Good / Thumbs Up | நல்லது | अच्छा |
| 11 | `BAD` | Evaluation | Bad / Dislike | மோசமானது | बुरा |
| 12 | `PLEASE` | Courtesy | Please | தயவுசெய்து | कृपया |
| 13 | `TEACHER` | Education | Teacher | ஆசிரியர் | शिक्षक |
| 14 | `STUDENT` | Education | Student | மாணவர் | छात्र |
| 15 | `CLASSROOM` | Education | Classroom | வகுப்பறை | कक्षा |
| 16 | `FOOD` | Daily Need | Food / Eat | உணவு | खाना |
| 17 | `RESTROOM` | Daily Need | Restroom / Toilet | கழிப்பறை | शौचालय |
| 18 | `WELCOME` | Courtesy | Welcome | வரவேற்கிறோம் | स्वागत |
| 19 | `UNDERSTAND` | Education | Understand | புரிகிறது | समझना |
| 20 | `STOP` | Command | Stop | நில் | रुको |

*Note: Any word outside this list is marked with an asterisk (e.g., `[ELEPHANT*]`) and flagged with a clear user alert.*

---

## 7. Windows Installation & Execution Guide

### Automated Startup
Run the Windows batch launcher from the project directory:
```bat
start_project.bat
```
This automatically validates Python and Node.js, installs dependencies, launches the Flask backend and Vite frontend in dedicated terminal windows, and opens your browser.

### Manual Setup

#### Step 1: Backend Setup
```powershell
cd SignBridgeAI\backend
python -m venv venv
.\venv\Scripts\activate
python -m pip install -r requirements.txt
python app.py
```
- Backend Service: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

#### Step 2: Frontend Setup
In a new terminal window:
```powershell
cd SignBridgeAI\frontend
npm install
npm run dev
```
- Frontend Application: `http://localhost:5173`

---

## 8. Running the AI & Model Training Modules

1. **Preprocessing Landmark Data:**
   ```powershell
   python training\preprocessing.py
   ```
2. **Training the CNN-LSTM Architecture:**
   ```powershell
   python training\train_cnn_lstm.py
   ```
3. **Evaluating Model Performance:**
   ```powershell
   python training\evaluate_model.py
   ```

---

## 9. Running Automated Test Suite

Execute the full suite of unit and integration tests:
```powershell
pytest tests/ -v
```
All 15 required verification targets (startup, APIs, gloss mapping, database CRUD, translation, landmark handling, confidence scoring, TTS, and avatar timeline) are tested.

---

## 10. Known Phase 1 Limitations & Phase 2 Roadmap

### Phase 1 Scope & Constraints
- **Fixed Sign Language:** Strict restriction to Indian Sign Language (ISL) only.
- **Limited Vocabulary:** 20 core signs; non-dictionary words generate informative warnings.
- **Model Engine:** Uses high-precision MediaPipe geometric landmark baseline for zero-dependency operation, while providing a plug-and-play CNN-LSTM weights loader.

### Planned for Phase 2
- Multiple sign languages (ASL, BSL, Auslan) with dynamic selection dropdown.
- Full 500+ sign vocabulary expansion with transformer-based sign translation.
- High-fidelity Blender photorealistic custom textured GLB avatar meshes.
- Two-way WebRTC live video room support.
