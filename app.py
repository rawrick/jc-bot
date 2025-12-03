import os
import discord
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("TOKEN")
if not TOKEN:
    raise ValueError("TOKEN environment variable not set in .env file")
PREFIX = os.getenv("PREFIX")
if not PREFIX:
    raise ValueError("PREFIX environment variable not set in .env file")
SOUND_DIR = os.getenv("SOUND_DIR")
if not SOUND_DIR:
    raise ValueError("SOUND_DIR environment variable not set in .env file")

# ------------ Intents ------------
intents = discord.Intents.default()
intents.message_content = True # Required to detect text messages
intents.voice_states = True

client = discord.Client(intents=intents)

# ------------ Helpers ------------
async def join_author_vc(message):
    """Join the sender's VC if bot is not already inside one."""
    if message.author.voice:
        channel = message.author.voice.channel
        if not message.guild.voice_client:
            await channel.connect()


async def play_sound(vc, name):
    """Play <name>.mp3 or .wav if it exists."""
    for ext in ["mp3", "wav"]:
        path = os.path.join(SOUND_DIR, f"{name}.{ext}")
        if os.path.exists(path):
            vc.stop()
            vc.play(discord.FFmpegPCMAudio(path, executable="bin/ffmpeg.exe"))
            return True
    return False


# ------------ Bot Events ------------
@client.event
async def on_ready():
    print(f"Logged in as {client.user}")


@client.event
async def on_message(message):
    # ignore bot messages
    if message.author.bot:
        return

    # must start with prefix like ?boom
    if not message.content.startswith(PREFIX):
        return

    # extract name e.g. "?boom" -> "boom"
    sound_name = message.content[len(PREFIX):].strip()

    # 1. auto-join VC if needed
    await join_author_vc(message)

    vc = message.guild.voice_client
    if not vc:
        await message.channel.send("Join a voice channel first!")
        return

    # 2. play sound
    if await play_sound(vc, sound_name):
        print(f"Playing {sound_name}")
    else:
        await message.channel.send("Sound not found. Available:\n" +
            ", ".join(f[:-4] for f in os.listdir(SOUND_DIR))
        )


client.run(TOKEN)
