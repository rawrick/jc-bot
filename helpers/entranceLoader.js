const fs = require("fs");
const path = require("path");

const CACHE = new Map();

/**
 * Load a guild entrance map into cache
 */
function loadGuildMap(guildId, baseDir = "./config/entranceMaps") {
    const file = path.join(baseDir, `${guildId}.json`);

    if (!fs.existsSync(file)) {
        CACHE.set(guildId, {});
        return {};
    }

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    CACHE.set(guildId, data);
    return data;
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
        mapsDir = "./config/entranceMaps",
        defaultSound = null
    } = options;

    let map = CACHE.get(guildId);
    if (!map) {
        map = loadGuildMap(guildId, mapsDir);
    }

    const entry = map[userId];
    if (!entry || !Array.isArray(entry.sounds) || entry.sounds.length === 0) {
        return defaultSound;
    }

    return pickRandom(entry.sounds);
}

/**
 * Optional hot-reload (future command support)
 */
function reloadGuildMap(guildId, mapsDir = "./config/entranceMaps") {
    CACHE.delete(guildId);
    return loadGuildMap(guildId, mapsDir);
}

module.exports = {
    getEntranceSound,
    reloadGuildMap
};
