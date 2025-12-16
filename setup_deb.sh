#!/bin/bash

# ---------- CONFIG ----------
GITHUB_REPO="https://github.com/rawrick/jc-bot.git"
PROJECT_DIR="$HOME/jc-bot"
SOUND_DIR="$PROJECT_DIR/sounds"
NODE_VERSION="24"

# ---------- UPDATE SYSTEM ----------
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# ---------- INSTALL DEPENDENCIES ----------
echo "Installing git, ffmpeg, curl, build-essential..."
sudo apt install -y git ffmpeg curl build-essential

# ---------- INSTALL NODE.JS ----------
echo "Installing Node.js $NODE_VERSION LTS..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs

# ---------- CLONE PROJECT ----------
if [ -d "$PROJECT_DIR" ]; then
    echo "Project folder exists. Pulling latest changes..."
    cd "$PROJECT_DIR" && git pull
else
    echo "Cloning project..."
    git clone "$GITHUB_REPO" "$PROJECT_DIR"
fi
cd "$PROJECT_DIR"

# ---------- INSTALL NODE PACKAGES ----------
echo "Installing npm packages..."
npm install

# ---------- SETUP ENV ----------
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    read -p "Enter your Discord Bot TOKEN: " BOT_TOKEN
    echo "TOKEN=$BOT_TOKEN" > .env
    echo "SOUND_DIR=$SOUND_DIR" >> .env
    read -p "Enter command prefix (default ?): " BOT_PREFIX
    BOT_PREFIX=${BOT_PREFIX:-?}
    echo "PREFIX=$BOT_PREFIX" >> .env
fi

# ---------- CREATE RUN SCRIPT ----------
echo "Creating run.sh..."
cat > run.sh <<EOL
#!/bin/bash
cd "$PROJECT_DIR"
export NODE_ENV=production
node JohnnyCash.js
EOL
chmod +x run.sh

# ---------- CREATE DESKTOP SHORTCUT ----------
DESKTOP_FILE="$HOME/Desktop/JC-Bot.desktop"
echo "Creating desktop shortcut..."
cat > "$DESKTOP_FILE" <<EOL
[Desktop Entry]
Name=JC Bot
Comment=Start the Discord Soundboard Bot
Exec=$PROJECT_DIR/run.sh
Icon=utilities-terminal
Terminal=true
Type=Application
Categories=Utility;
EOL
chmod +x "$DESKTOP_FILE"

# ---------- CREATE SYSTEMD SERVICE ----------
SERVICE_FILE="/etc/systemd/system/jc-bot.service"
echo "Creating systemd service..."
sudo bash -c "cat > $SERVICE_FILE" <<EOL
[Unit]
Description=JC Discord Soundboard Bot
After=network.target

[Service]
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node $PROJECT_DIR/JohnnyCash.js
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=$PROJECT_DIR/.env
User=pi

[Install]
WantedBy=multi-user.target
EOL

# ---------- ENABLE AND START SERVICE ----------
echo "Enabling systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable jc-bot
sudo systemctl start jc-bot

echo "------------------------------------------------------"
echo "Setup complete!"
echo "You can start the bot with ./run.sh or via Desktop shortcut."
echo "To check logs: sudo journalctl -u jc-bot -f"
echo "------------------------------------------------------"
