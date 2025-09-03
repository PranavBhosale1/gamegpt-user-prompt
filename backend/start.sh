#!/bin/bash

echo "Starting GameGPT Backend..."
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing/updating dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo
    echo "WARNING: .env file not found!"
    echo "Please copy .env.example to .env and configure your API keys."
    echo
    exit 1
fi

# Run the application
echo
echo "Starting FastAPI server..."
echo "Visit http://localhost:8000/docs for API documentation"
echo "Press Ctrl+C to stop the server"
echo

python main.py
