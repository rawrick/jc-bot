#!/bin/bash

# Ensure the script has execute permissions
chmod +x "$0"

BOT_DIR="/home/pi/jc-bot"
VENV_DIR="$BOT_DIR/botenv" 
REQ_FILE="$BOT_DIR/requirements.txt"
BOT_SCRIPT="$BOT_DIR/app.py"

cd "$BOT_DIR" || exit

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "[INFO] Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
pip install --upgrade pip

# Install requirements 
if [ -f "$REQ_FILE" ]; then
    echo "[INFO] Installing requirements from requirements.txt..."
    pip install -r "$REQ_FILE"
else
    echo "[WARN] requirements.txt not found. Skipping..."
fi

# Start the bot
echo "[INFO] Starting the bot..."
python3 "$BOT_SCRIPT"
