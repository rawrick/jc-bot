# Discord Soundboard Bot

## How to install

### Debian

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential ffmpeg

Install Node.js

    curl -fsSL https://raw.githubusercontent.com/mklement0/n-install/stable/bin/n-install | bash -s 22

Clone this repository

    cd ~
    git clone https://github.com/rawrick/jc-bot.git jc-bot
    cd jc-bot

Install Node.js packages

    npm install

Configure enviornment variables

    nano .env

Add

    TOKEN=YOUR_DISCORD_BOT_TOKEN
    SOUND_DIR=/home/pi/jc-bot/soundboard/
    PREFIX=?

Run the bot

    node JohnnyCash.js

## Windows

1. Install [Node.js](https://nodejs.org/en/download) v22.21.1 (LTS)

2. Clone this repository [jc-bot](https://github.com/rawrick/jc-bot)

3. In your shell navigate to the project folder and install dependencies with

    npm install

5. Create a sound file folder 

4. Create a file ".env"

    TOKEN=YOUR_DISCORD_BOT_TOKEN
    SOUND_DIR=/PATH/TO/SOUNDFILES
    PREFIX=CUSTOM_PREFIX

5. Run the bot

    node JohnnyCash.js


