const path = require("path");

module.exports = {
    SOUND_DIR: path.join("/data", "soundboard"),
    MAPS_DIR: path.join("/config", "entranceMaps"),
    AUDIO_FORMAT: process.env.AUDIO_FORMAT || "mp3",
    AFK_GRACE_MS: (parseInt(process.env.AFK_GRACE_PERIOD) || 30) * 1000,
    TOKEN: process.env.TOKEN,
    PREFIX: process.env.PREFIX || "?",
    USER_JOIN_DEFAULT: process.env.USER_JOIN_DEFAULT || "join",
    USER_LEAVE_DEFAULT: process.env.USER_LEAVE_DEFAULT || "leave",
};
