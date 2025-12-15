const fs = require("fs");
const { get } = require("http");
const path = require("path");

const CACHE = new Map();

const MAP_DIR = "./config/entranceMaps";


function getGuildMapPath(guildId, baseDir = MAP_DIR) {
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }
    return path.join(baseDir, `${guildId}.json`);
}

/**
 * Load a guild entrance map into cache
 */
function loadGuildMap(guildId, baseDir = MAP_DIR) {
    const file = getGuildMapPath(guildId, baseDir);

    if (!fs.existsSync(file)) {
        CACHE.set(guildId, {});
        return {};
    }

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    CACHE.set(guildId, data);
    return data;
}

/**
 * Optional hot-reload (future command support)
 */
function reloadGuildMap(guildId, mapsDir = MAP_DIR) {
    CACHE.delete(guildId);
    return loadGuildMap(guildId, mapsDir);
}

/**
 * Save a guild entrance map to disk
 */
function saveGuildMap(guildId, data, baseDir) {
    const file = getGuildMapPath(guildId, baseDir);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
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
    const {
        mapsDir = MAP_DIR,
        defaultSound = null
    } = options;

    let map = CACHE.get(guildId);
    if (!map) {
        map = loadGuildMap(guildId, mapsDir);
    }

    const entry = map[userId];
    if (!entry || !Array.isArray(entry.sounds) || entry.sounds.length === 0) {
        console.log(`User with ID ${userId} not found.`)
        return defaultSound;
    }

    return pickRandom(entry.sounds);
}

/**
 * ?entrance add @user sound.mp3
 * ?entrance remove @user sound.mp3
 * ?entrance clear @user
 */
async function handleEntranceCommand(message, options = {}) {
    const {
        soundDir = "./soundboard",
        mapsDir = "./config/entranceMaps",
        audioFormat = "mp3"
    } = options;

    const parts = message.content.trim().split(/\s+/);
    if (parts.length < 3) return;

    const action = parts[1];
    const user = message.mentions.users.first();

    if (!user) {
        await message.reply("❌ Please mention a user.");
        return;
    }

    const guildId = message.guild.id;
    const userId = user.id;

    const map = loadGuildMap(guildId, mapsDir);

    if (!map[userId]) {
        map[userId] = {
            username: user.username,
            sounds: []
        };
    }

    // ?entrance clear @user
    if (action === "clear") {
        map[userId].sounds = [];
        saveGuildMap(guildId, map, mapsDir);
        reloadGuildMap(guildId, mapsDir);
        await message.reply(`✅ Cleared entrance sounds for **${user.username}**`);
        return;
    }

    // add / remove require a sound
    if (parts.length < 4) {
        await message.reply("❌ Please specify a sound file.");
        return;
    }

    const soundFile = parts[3] + `.${audioFormat}`;
    const soundPath = path.join(soundDir, soundFile);

    if (!fs.existsSync(soundPath)) {
        await message.reply(`❌ Sound file not found: \`${soundFile}\``);
        return;
    }

    const sounds = map[userId].sounds;

    // ?entrance add @user sound.mp3
    if (action === "add") {
        if (sounds.includes(soundFile)) {
            await message.reply("⚠️ This sound is already assigned to this user.");
            return;
        }

        sounds.push(soundFile);
        saveGuildMap(guildId, map, mapsDir);
        reloadGuildMap(guildId, mapsDir);

        await message.reply(
            `✅ Added entrance sound \`${soundFile}\` to **${user.username}**`
        );
        return;
    }

    // ?entrance remove @user sound.mp3
    if (action === "remove") {
        const index = sounds.indexOf(soundFile);
        if (index === -1) {
            await message.reply("⚠️ This sound is not assigned to this user.");
            return;
        }

        sounds.splice(index, 1);
        saveGuildMap(guildId, map, mapsDir);
        reloadGuildMap(guildId, mapsDir);

        await message.reply(
            `✅ Removed entrance sound \`${soundFile}\` from **${user.username}**`
        );
        return;
    }

    await message.reply("❌ Unknown entrance command.");
}

module.exports = {
    getEntranceSound,
    handleEntranceCommand,
    reloadGuildMap,
};
