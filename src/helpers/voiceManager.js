const fs = require("fs");
const path = require("path");

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    VoiceConnectionStatus,
    entersState
} = require("@discordjs/voice");

const { SOUND_DIR, AUDIO_FORMAT } = require("./config");

const voiceStates = new Map();

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

    if (!filename.endsWith("." + AUDIO_FORMAT)) {
        filename += "." + AUDIO_FORMAT;
    }
    const fullPath = path.join(SOUND_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
        console.log("File does not exist:", fullPath);
        return;
    }

    const resource = createAudioResource(fullPath);
    state.player.play(resource);
    console.log("Playing:", filename);
}

/**
 * Play a random sound.
 * If guildId is provided, plays in that guild only.
 * Otherwise plays in all active voice connections.
 */
function playRandomSound(guildId = null) {
    const files = fs.readdirSync(SOUND_DIR).filter(f => f.endsWith("." + AUDIO_FORMAT));
    if (files.length === 0) return;
    const randomFile = files[Math.floor(Math.random() * files.length)];
    console.log("Selected random sound file:", randomFile);

    if (guildId) {
        playSound(guildId, randomFile);
    } else {
        for (const id of voiceStates.keys()) {
            playSound(id, randomFile);
        }
    }
}

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
