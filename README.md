# Discord Soundboard Bot
## Installation (Docker)
### Docker Compose:
```yaml
services:
  jc-bot:
    container_name: jc-bot
    build: .
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./jc-bot_data/config:/config:rw
      - ./jc-bot_data/data:/data:ro
    env_file:
      - /config/.env
    environment:
      - NODE_ENV=production
```
### Configuration
Create a .env inside `./jc-bot_data/config`:
```env
# required
TOKEN=YOURAPIKEY
# optional
PREFIX=?
AFK_GRACE_PERIOD=30
USER_JOIN_DEFAULT=join
USER_LEAVE_DEFAULT=leave
```
