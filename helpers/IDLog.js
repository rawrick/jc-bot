/**
 * Prints a table of guild member IDs and usernames
 * @param {Message} message discord.js message object
 */
async function getIDs(message) {
    const guild = message.guild;
    console.log("Getting IDs for guild:", guild?.name ?? "Unknown Guild");
    if (!guild) return;

    // Ensure all members are fetched
    const members = await guild.members.fetch();
    console.log("Total members fetched:", members.size);

    const lines = [];
    lines.push("ID".padEnd(20) + "Username");
    lines.push("-".repeat(40));

    for (const member of members.values()) {
        if (member.user.bot) continue;

        const username =
            member.user.globalName ??
            member.user.username ??
            "Unknown";

        lines.push(
            member.user.id.padEnd(20) + username
        );
        console.log("Fetched member:", username, member.user.id);
    }

    // Discord message limit safety
    const output = lines.join("\n");
    const chunks = output.match(/[\s\S]{1,1900}/g) || [];

    for (const chunk of chunks) {
        await message.channel.send("```" + chunk + "```");
    }
}

module.exports = {
    getIDs
};
