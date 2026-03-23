const fs = require("fs");
const path = require("path");

const { SOUND_DIR, MAPS_DIR, AUDIO_FORMAT } = require("./config");

const CACHE = new Map();

function getGuildMapPath(guildId) {
    if (!fs.existsSync(MAPS_DIR)) {
        fs.mkdirSync(MAPS_DIR, { recursive: true });
    }
    return path.join(MAPS_DIR, `${guildId}.json`);
}

/**
 * Load a guild entrance map into cache
 */
function loadGuildMap(guildId) {
    const file = getGuildMapPath(guildId);

    if (!fs.existsSync(file)) {
        CACHE.set(guildId, {});
        return {};
    }

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    CACHE.set(guildId, data);
    return data;
}

/**
 * Save a guild entrance map to disk and refresh cache
 */
function saveAndReloadMap(guildId, data) {
    const file = getGuildMapPath(guildId);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    CACHE.delete(guildId);
    return loadGuildMap(guildId);
}

/**
 * Optional hot-reload (future command support)
 */
function reloadGuildMap(guildId) {
    CACHE.delete(guildId);
    return loadGuildMap(guildId);
}

/**
 * Pick a random element from array
 */
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Resolve entrance sound for a user in a guild
 * @returns {string|null}
 */
function getEntranceSound(guildId, userId, options = {}) {
    const { defaultSound = null } = options;

    let map = CACHE.get(guildId);
    if (!map) {
        map = loadGuildMap(guildId);
    }

    const entry = map[userId];
    if (!entry || !Array.isArray(entry.sounds) || entry.sounds.length === 0) {
        console.log(`User with ID ${userId} not found.`);
        return defaultSound;
    }

    return pickRandom(entry.sounds);
}

/**
 * ?entrance add @user sound
 * ?entrance remove @user sound
 * ?entrance clear @user
 * ?entrance list @user
 */
async function handleEntranceCommand(message) {
    const parts = message.content.trim().split(/\s+/);
    if (parts.length < 3) {
        await message.reply("❌ Please mention a user or provide a user ID.");
        return;
    }

    const action = parts[1];
    let user = message.mentions.users.first();

    if (!user) {
        // try to parse as ID
        try {
            user = await message.guild.members.fetch(parts[2]).then(m => m.user);
        } catch {
            await message.reply("❌ Could not find user.");
            return;
        }
    }

    const guildId = message.guild.id;
    const userId = user.id;

    let map = CACHE.get(guildId);
    if (!map) {
        map = loadGuildMap(guildId);
    }

    if (!map[userId]) {
        map[userId] = {
            username: user.username,
            sounds: []
        };
    }

    // ?entrance list @user
    if (action === "list") {
        const entry = map[userId];
        if (!entry || !entry.sounds || entry.sounds.length === 0) {
            await message.reply(`⚠️ No entrance sounds assigned for **${user.username}**.`);
            return;
        }
        const soundsList = entry.sounds.join("\n");
        await message.reply(
            `🎵 Entrance sounds for **${user.username}**:\n\`\`\`\n${soundsList}\n\`\`\``
        );
        return;
    }

    // ?entrance clear @user
    if (action === "clear") {
        map[userId].sounds = [];
        saveAndReloadMap(guildId, map);
        await message.reply(`✅ Cleared entrance sounds for **${user.username}**`);
        return;
    }

    // add / remove require a sound
    if (parts.length < 4) {
        await message.reply("❌ Please specify a sound file.");
        return;
    }

    const soundFile = `${parts[3]}.${AUDIO_FORMAT}`;
    const soundPath = path.join(SOUND_DIR, soundFile);

    if (!fs.existsSync(soundPath)) {
        await message.reply(`❌ Sound file not found: \`${soundFile}\``);
        return;
    }

    const sounds = map[userId].sounds;

    // ?entrance add @user sound
    if (action === "add") {
        if (sounds.includes(soundFile)) {
            await message.reply("⚠️ This sound is already assigned to this user.");
            return;
        }

        sounds.push(soundFile);
        saveAndReloadMap(guildId, map);
        await message.reply(`✅ Added entrance sound \`${soundFile}\` to **${user.username}**`);
        return;
    }

    // ?entrance remove @user sound
    if (action === "remove") {
        const index = sounds.indexOf(soundFile);
        if (index === -1) {
            await message.reply("⚠️ This sound is not assigned to this user.");
            return;
        }

        sounds.splice(index, 1);
        saveAndReloadMap(guildId, map);
        await message.reply(`✅ Removed entrance sound \`${soundFile}\` from **${user.username}**`);
        return;
    }

    await message.reply("❌ Unknown entrance command.");
}

module.exports = {
    getEntranceSound,
    handleEntranceCommand,
    reloadGuildMap,
};
