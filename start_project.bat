@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo          SignBridge AI - Windows Automated Startup Script
echo     AI-Based Indian Sign Language (ISL) Bidirectional System
echo =====================================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VER=%%i
echo [OK] Detected %PYTHON_VER%

:: 2. Check Node.js and npm
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Detected Node.js %NODE_VER%

npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] Detected npm %NPM_VER%
echo.

:: 3. Setup Backend Environment
echo ---------------------------------------------------------------------
echo  Setting up Backend (Flask, SQLAlchemy, ISL AI modules)...
echo ---------------------------------------------------------------------
cd /d "%~dp0backend"

if exist "venv\Scripts\activate.bat" (
    echo [*] Activating virtual environment...
    call venv\Scripts\activate.bat
)

python -c "import flask, flask_cors, sqlalchemy" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Installing backend dependencies...
    python -m pip install -r requirements.txt --quiet --no-warn-script-location
) else (
    echo [OK] Python backend dependencies already installed.
)

:: 4. Setup Frontend Environment
echo.
echo ---------------------------------------------------------------------
echo  Setting up Frontend (React, Vite, Three.js, Tailwind CSS)...
echo ---------------------------------------------------------------------
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [*] Installing frontend npm packages (this may take 1-2 minutes)...
    call npm install --silent
) else (
    echo [OK] Frontend node_modules already present.
)

:: 5. Port Conflict Checks
echo.
echo ---------------------------------------------------------------------
echo  Checking Network Ports...
echo ---------------------------------------------------------------------
set BACKEND_PORT=5000
set FRONTEND_PORT=5173

netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 5000 is currently occupied.
    echo If another instance is running, it will be reused.
    echo Otherwise set PORT=5001 before starting backend.
)

netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 5173 is in use. Vite will automatically switch to 5174 if needed.
)

:: 6. Launch Services in Separate Terminals
echo.
echo =====================================================================
echo  Starting SignBridge AI Services...
echo =====================================================================
echo.
echo  Backend API Service:   http://localhost:%BACKEND_PORT%
echo  Health Check:          http://localhost:%BACKEND_PORT%/api/health
echo  Frontend Application:  http://localhost:%FRONTEND_PORT%
echo.

:: Start Backend in separate window
cd /d "%~dp0backend"
start "SignBridge AI - Flask Backend (Port %BACKEND_PORT%)" cmd /k "python app.py"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start Frontend in separate window
cd /d "%~dp0frontend"
start "SignBridge AI - React Vite Frontend (Port %FRONTEND_PORT%)" cmd /k "npm run dev"

echo.
echo [SUCCESS] Both backend and frontend servers have been launched in separate windows!
echo Keep those windows open to view runtime logs.
echo Opening browser to http://localhost:5173 ...
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause
