# SignBridge AI — Installation & Setup Guide

## 1. Prerequisites

- **Operating System:** Windows 10/11 (or Linux/macOS)
- **Python:** Version 3.10 to 3.12+
- **Node.js:** Version 18+ or 20+ (with npm)
- **Webcam & Microphone:** Connected and allowed in browser settings

---

## 2. Automated Quick Start (Windows)

Simply run the automated startup script:

```bat
start_project.bat
```

This batch file will:
1. Verify Python, Node.js, and npm.
2. Initialize virtual environments if required.
3. Install backend and frontend dependencies.
4. Launch the Flask Backend at `http://localhost:5000`.
5. Launch the React Vite Frontend at `http://localhost:5173`.

---

## 3. Manual Step-by-Step Installation

### Backend Setup

1. Open PowerShell or Command Prompt:
   ```powershell
   cd SignBridgeAI\backend
   ```
2. (Optional) Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```powershell
   python app.py
   ```
   The backend will be live at `http://localhost:5000` with database auto-initialized at `backend/database/signbridge.db`.

---

### Frontend Setup

1. In a new terminal window:
   ```powershell
   cd SignBridgeAI\frontend
   ```
2. Install Node dependencies:
   ```powershell
   npm install
   ```
3. Run the development server:
   ```powershell
   npm run dev
   ```
   The frontend will be live at `http://localhost:5173`.
