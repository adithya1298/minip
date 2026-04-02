@echo off
title Vocalis Therapy Launcher
echo ====================================================
echo Starting AI-Driven Speech Therapy Application...
echo ====================================================

echo.
echo Starting FastAPI Backend (Port 8000)...
start cmd /k "cd backend && call .\venv\Scripts\activate.bat && uvicorn main:app --reload"

echo.
echo Starting React Frontend (Port 5173)...
start cmd /k "cd frontend && npm run dev -- --open"

echo.
echo Done! Two new terminal windows have been opened for the frontend and backend.
echo The application should automatically open in your default web browser soon.
echo Feel free to close this launcher window.
pause
