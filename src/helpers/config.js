const path = require("path");

module.exports = {
    SOUND_DIR: path.join("/data", "soundboard"),
    MAPS_DIR: path.join("/config", "entranceMaps"),
    AUDIO_FORMAT: process.env.AUDIO_FORMAT || "mp3",
    // Seconds to wait after the last user leaves before moving to AFK channel
    AFK_GRACE_MS: (parseInt(process.env.AFK_GRACE_PERIOD) || 30) * 1000,
};
