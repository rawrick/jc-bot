const MEMBER_CACHE = new Map();

/**
 * Cache structure:
 * guildId => {
 *   members: Collection,
 *   timestamp: number
 * }
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached or fresh guild members
 */
async function getGuildMembersCached(guild, progressFn = null) {
    const cached = MEMBER_CACHE.get(guild.id);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.members;
    }

    if (progressFn) await progressFn("Fetching guild members from Discord…");

    const members = await guild.members.fetch();

    MEMBER_CACHE.set(guild.id, {
        members,
        timestamp: now
    });

    return members;
}

/**
 * Handle ?getIDs command
 */
async function getIDs(message) {
    const guild = message.guild;
    if (!guild) return;

    // Initial progress message
    const statusMsg = await message.channel.send("⏳ Preparing member list…");

    let members;
    try {
        members = await getGuildMembersCached(
            guild,
            async (text) => {
                await statusMsg.edit("⏳ " + text);
            }
        );
    } catch (err) {
        await statusMsg.edit("❌ Failed to fetch guild members.");
        console.error(err);
        return;
    }

    await statusMsg.edit("📝 Building ID table…");

    const lines = [];
    lines.push("ID".padEnd(20) + "Username");
    lines.push("-".repeat(40));

    for (const member of members.values()) {
        if (member.user.bot) continue;

        const name =
            member.user.globalName ??
            member.user.username ??
            "Unknown";

        lines.push(
            member.user.id.padEnd(20) + name
        );
    }

    // Split output safely
    const output = lines.join("\n");
    const chunks = output.match(/[\s\S]{1,1900}/g) || [];

    await statusMsg.edit(
        `✅ Found ${lines.length - 2} members. Sending output…`
    );

    for (const chunk of chunks) {
        await message.channel.send("```" + chunk + "```");
    }

    await statusMsg.edit("✅ Done.");
}

module.exports = {
    getIDs
};
