require("dotenv").config();
const fs = require("fs");

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
const ALONE_GRACE_MS = 30_000;

/**
 * Get or create voice state for a guild
 */
function getGuildVoice(guildId) {
    if (!voiceStates.has(guildId)) {
        voiceStates.set(guildId, {
            connection: null,
            player: createAudioPlayer(),
            channelId: null,
            aloneTimer: null,
            moving: false
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

    state.moving = true;
    cancelAloneTimer(guildId);

    // Destroy old connection AFTER marking move
    if (state.connection) {
        try {
            state.connection.destroy();
        } catch {}
    }

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId,
        adapterCreator: channel.guild.voiceAdapterCreator
    });

    connection.subscribe(state.player);

    state.connection = connection;
    state.channelId = channel.id;

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        if (state.moving) {
            console.log("[VOICE] Disconnected during intentional move");
            return;
        }

        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
            ]);
        } catch {
            console.warn("[VOICE] Reconnect failed, cleaning up");
            cleanupGuildVoice(guildId);
        }
    });

    // Clear moving flag once connected
    connection.once(VoiceConnectionStatus.Ready, () => {
        state.moving = false;
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

    const fullPath = sound_dir + filename;
    if (!fs.existsSync(fullPath)) {
        console.log("File does not exist:", filename);
        return;
    }

    const resource = createAudioResource(fullPath);
    state.player.play(resource);
    console.log("Playing:", filename);
}

/**
 * Cleanup when voice is lost
 */
function cleanupGuildVoice(guildId) {
    const state = voiceStates.get(guildId);
    if (!state) return;

    cancelAloneTimer(guildId);

    try {
        state.connection?.destroy();
    } catch {}

    voiceStates.delete(guildId);
}

/**
 * Check if bot is alone
 */
function isBotAlone(channel, clientUserId) {
    return channel.members.every(
        m => m.user.bot || m.user.id === clientUserId
    );
}

/**
 * Cancel AFK timer
 */
function cancelAloneTimer(guildId) {
    const state = voiceStates.get(guildId);
    if (state?.aloneTimer) {
        clearTimeout(state.aloneTimer);
        state.aloneTimer = null;
    }
}

/**
 * Handle alone state
 */
function handleAloneState(channel, client) {
    const guildId = channel.guild.id;
    const state = voiceStates.get(guildId);
    if (!state || state.aloneTimer) return;

    state.aloneTimer = setTimeout(async () => {
        state.aloneTimer = null;

        if (!state.connection) return;
        if (!isBotAlone(channel, client.user.id)) return;

        const afkChannel = channel.guild.afkChannel;

        if (afkChannel && afkChannel.joinable) {
            console.log(`[VOICE] Moving to AFK channel (${afkChannel.name})`);
            await joinVoice(afkChannel);
        } else {
            console.log("[VOICE] No AFK channel — disconnecting");
            cleanupGuildVoice(guildId);
        }
    }, ALONE_GRACE_MS);
}

module.exports = {
    joinVoice,
    playSound,
    cleanupGuildVoice,
    handleAloneState,
    isBotAlone,
    cancelAloneTimer
};
