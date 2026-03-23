const path = require("path");

module.exports = {
    SOUND_DIR: path.join("/data", "soundboard"),
    MAPS_DIR: path.join("/config", "entranceMaps"),
    AUDIO_FORMAT: process.env.AUDIO_FORMAT || "mp3",
};
