const MEMBER_CACHE = new Map();
const fs = require("fs");
const path = require("path");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require("discord.js");

/**
 * Cache structure:
 * guildId => {
 *   members: Collection,
 *   timestamp: number
 * }
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;
const TIMEOUT = 180_000; // 3 minute
const AUDIO_REGEX = /\.(mp3|wav|ogg|opus)$/i;

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
 * Handle ?members command
 */
async function getServerMembers(message) {
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

    await statusMsg.edit("✅ Done.", guild.id);
}

async function getServerInfo(message) {
    const guild = message.guild;
    // todo: bot count
    await message.channel.send(`Server Name: ${guild.name}\nTotal Members: ${guild.memberCount}\nServer ID: ${guild.id}`);

}

async function getSoundlist(message) {
    const soundDir = process.env.SOUND_DIR;

    if (!fs.existsSync(soundDir)) {
        await message.reply("❌ Sound directory does not exist.");
        return;
    }

    // Parse optional argument
    const args = message.content.trim().split(/\s+/).slice(1);
    const arg = args[0];

    // Load & normalize sounds
    let sounds = fs.readdirSync(soundDir)
        .filter(f => AUDIO_REGEX.test(f))
        .map(f => ({
            name: path.parse(f).name,
            file: f
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    // Filter by first letter
    if (arg && isNaN(arg)) {
        const letter = arg.toLowerCase();
        sounds = sounds.filter(s =>
            s.name.toLowerCase().startsWith(letter)
        );
    }

    if (sounds.length === 0) {
        await message.reply("⚠️ No sounds found.");
        return;
    }

    let page = 0;

    // Jump to page if number provided
    if (arg && !isNaN(arg)) {
        page = Math.max(0, parseInt(arg, 10) - 1);
    }

    const maxPage = Math.ceil(sounds.length / PAGE_SIZE) - 1;
    page = Math.min(page, maxPage);

    const renderPage = () => {
        const start = page * PAGE_SIZE;
        const pageSounds = sounds.slice(start, start + PAGE_SIZE);

        return {
            content:
                `🎵 **Available Sounds**` +
                (arg && isNaN(arg) ? ` (starting with **${arg.toUpperCase()}**)` : "") +
                ` — page ${page + 1}/${maxPage + 1}\n` +
                "```" +
                pageSounds.map(s => s.name).join("\n") +
                "```",
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev")
                        .setLabel("◀")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("▶")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === maxPage)
                )
            ]
        };
    };

    const sent = await message.reply(renderPage());

    const collector = sent.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: TIMEOUT
    });

    collector.on("collect", async (interaction) => {
        if (interaction.customId === "prev") page--;
        if (interaction.customId === "next") page++;

        await interaction.update(renderPage());
    });

    collector.on("end", async () => {
        try {
            await sent.edit({ components: [] });
        } catch { }
    });
};

module.exports = {
    getServerMembers,
    getServerInfo,
    getSoundlist
};
