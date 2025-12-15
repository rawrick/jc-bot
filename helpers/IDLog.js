const fs = require("fs");
const path = require("path");

/**
 * Prints a table of entrance sound IDs → usernames
 * @param {Client} client discord.js client
 * @param {Object} options
 */
async function printJoinSoundTable(client, options = {}) {
    const guildId = client.guildId;
    const {
        joinDir = "./soundboard",
        audioFormat = "mp3",
        userMapPath = "./config/entranceMaps/.json"
    } = options;

    // Load optional user map
    let userMap = {};
    if (fs.existsSync(userMapPath)) {
        userMap = JSON.parse(fs.readFileSync(userMapPath, "utf8"));
    }

    // Read join directory
    if (!fs.existsSync(joinDir)) {
        console.log("Join directory not found:", joinDir);
        return;
    }

    const files = fs.readdirSync(joinDir)
        .filter(f => f.endsWith("." + audioFormat));

    if (!files.length) {
        console.log("No entrance sounds found.");
        return;
    }

    console.log("ID".padEnd(20), "Username");
    console.log("-".repeat(40));

    for (const file of files) {
        const id = path.basename(file, "." + audioFormat);

        let name =
            userMap[id]?.globalName ??
            userMap[id]?.username ??
            null;

        // Try live fetch if not in map
        if (!name) {
            try {
                const user = await client.users.fetch(id);
                name = user.globalName ?? user.username;
            } catch {
                name = "Unknown";
            }
        }

        console.log(id.padEnd(20), name);
    }
}

module.exports = {
    printJoinSoundTable
};
