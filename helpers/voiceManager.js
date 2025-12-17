require("dotenv").config();
const fs = require('fs');

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    VoiceConnectionStatus,
    entersState
} = require("@discordjs/voice");

const voiceStates = new Map();

const sound_dir = process.env.SOUND_DIR;
const audio_format = process.env.AUDIO_FORMAT || "mp3";

/**
 * Get or create voice state for a guild
 */
function getGuildVoice(guildId) {
    if (!voiceStates.has(guildId)) {
        voiceStates.set(guildId, {
            connection: null,
            player: createAudioPlayer(),
            channelId: null
        });
    }
    return voiceStates.get(guildId);
}

/**
 * Join a voice channel (per guild)
 */
async function joinVoice(channel) {
    const guildId = channel.guild.id;
    const state = getGuildVoice(guildId);

    if (state.connection && state.channelId === channel.id) {
        return state;
    }

    // Cleanup old connection
    if (state.connection) {
        try {
            state.connection.destroy();
        } catch { }
    }

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId,
        adapterCreator: channel.guild.voiceAdapterCreator
    });

    connection.subscribe(state.player);

    state.connection = connection;
    state.channelId = channel.id;

    // Reconnect handling (safe)
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
            ]);
        } catch {
            cleanupGuildVoice(guildId);
        }
    });

    return state;
}

/**
 * Play a sound in a specific guild
 */
function playSound(guildId, filename) {
    const state = voiceStates.get(guildId);
    if (!state || !state.connection) return;

    if (!filename.endsWith("." + audio_format)) {
        filename += "." + audio_format;
    }
    // Construct full path
    let fullPath = sound_dir;
    fullPath += filename;

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
        console.log("File does not exist:", filename);
        return;
    }

    const resource = createAudioResource(fullPath);
    state.player.play(resource);
    console.log("Playing:", filename);
}

/**
 * Function to play a random sound
 */
function playRandomSound(guildId) {
    // List all sound files
    const files = fs.readdirSync(sound_dir).filter(f => f.endsWith(audio_format));
    if (files.length === 0) return;
    // Select a random file
    const randomFile = files[Math.floor(Math.random() * files.length)];
    console.log("Selected random sound file:", randomFile);;
    playSound(guildId, randomFile);
};

/**
 * Cleanup when voice is lost
 */
function cleanupGuildVoice(guildId) {
    const state = voiceStates.get(guildId);
    if (!state) return;

    try {
        state.connection?.destroy();
    } catch { }

    voiceStates.delete(guildId);
}

module.exports = {
    joinVoice,
    playSound,
    playRandomSound,
    cleanupGuildVoice
};
