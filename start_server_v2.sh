#!/bin/bash

# Split-Flap Display Server v2.0 Starter Script

echo "🛩️  Starting Split-Flap Display Server v2.0..."
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment."
        exit 1
    fi
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if required packages are installed
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "📦 Installing required Python packages..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies. Please run: pip install -r requirements.txt"
        exit 1
    fi
fi

# Check for .env file
if [ ! -f .env ]; then
    echo "ℹ️  No .env file found. Using default configuration."
    echo "   (Create .env from .env.example to customize)"
    echo ""
fi

# Get port from argument or default
PORT=${1:-8001}

# Start the server
echo "🚀 Starting server on port $PORT..."
echo ""
python3 server.py $PORT