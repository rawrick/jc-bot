# Discord Soundboard Bot

## How to install

### Debian

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential ffmpeg

Install Node.js

    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs

Clone this repository

    cd ~
    git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git jc-bot
    cd jc-bot

Install Node.js packages

    npm install

Configure enviornment variables

    nano .env

Add

    TOKEN=YOUR_DISCORD_BOT_TOKEN
    SOUND_DIR=/home/pi/jc-bot/sounds/
    PREFIX=?


