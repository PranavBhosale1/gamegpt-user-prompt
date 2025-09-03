@echo off
echo Starting GameGPT Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies if requirements.txt is newer than last install
echo Installing/updating dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and configure your API keys.
    echo.
    pause
    exit /b 1
)

REM Run the application
echo.
echo Starting FastAPI server...
echo Visit http://localhost:8000/docs for API documentation
echo Press Ctrl+C to stop the server
echo.

python main.py
