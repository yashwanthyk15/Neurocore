@echo off
echo Starting NeuroCore...
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found. Please install from https://nodejs.org
    pause
    exit /b 1
)

if not exist "backend\.env" (
    echo Creating .env from template...
    copy "backend\.env.example" "backend\.env"
    echo Please edit backend\.env and add your GEMINI_API_KEY
    echo.
)

echo Installing backend dependencies...
cd backend
call npm install --silent
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install --silent
cd ..

echo.
echo Starting backend server...
start "NeuroCore Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend...
cd frontend
call npm start
