require("dotenv").config();

// 
const { playSound, joinVoice, playRandomSound } = require("./helpers/voiceManager");
const { getEntranceSound, handleEntranceCommand } = require("./helpers/entranceManager");
const { getServerMembers, getServerInfo, getSoundlist } = require("./helpers/infoManager");

// Child process for random sound playing
const { fork } = require("child_process");
const child = fork("./helpers/randomStartStop.js");

// Discord.js imports
const { Client, GatewayIntentBits, Events } = require("discord.js");

// Config Environment Variables
const token = process.env.TOKEN;
const prefix = process.env.PREFIX;
const user_join_default = process.env.USER_JOIN_DEFAULT || "sus3";
const user_leave = process.env.USER_LEAVE || "rave";

// Create Discord Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	]
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
	console.error("Unhandled promise rejection:", reason);
});

// Ready startup message
client.once(Events.ClientReady, () => {
	console.log("Logged in as:", client.user.tag);
	console.log("Hello there!");
});

// Listen for messages from child process
child.on("message", (msg) => {
	if (msg === "randomSound") {
		console.log("Requesting random sound from child process");
		playRandomSound();
	}
});

// Entrance and Leave sounds
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
	let oldChannel = oldState.channel
	let newChannel = newState.channel
	const user = newState.member.user;
	const guild = newState.guild;

	// Ignore self
	if (user.id === client.user.id) return;

	// User joins a channel
	if (oldChannel !== newChannel && newChannel !== null) {
		const sound = getEntranceSound(guild.id, user.id, { defaultSound: user_join_default })
		await joinVoice(newChannel);
		console.log("Joining User:", user.username, user.id);
		playSound(guild.id, sound);
	}

	// User leaves a channel
	if (newChannel === null) {
		await joinVoice(oldChannel);
		console.log("User left:", user.username, user.id);
		playSound(guild.id, user_leave);
	}
});

// Prefix Commands
client.on(Events.MessageCreate, async (message) => {
	// Ignore bot messages
	if (message.author.bot) return;
	// Ignore messages without prefix
	if (!message.content.startsWith(prefix)) return;

	const guildId = message.guild.id;

	const text = message.content;
	const command = text.slice(prefix.length).trim().split(/\s+/).shift().toLowerCase();

	// Join VC of message author
	if (message.member.voice.channel) {
		await joinVoice(message.member.voice.channel);
	}

	switch (command) {
		// Play matching sound file
		default:
			playSound(guildId, command);
			break;
		case "members":
			getServerMembers(message);
			break;
		case "serverinfo":
			getServerInfo(message);
			break;
		// Soundlist Command
		case "soundlist":
			await getSoundlist(message);
			break;
		// Entrance Command
		case "entrance":
			await handleEntranceCommand(message);
			break;
		// Random Sound Command
		case "random":
			playRandomSound(guildId);
			break;
		// Start random Playback
		case "rstart":
			child.send("start");
			break;
		// Stop random Playback
		case "rstop":
			child.send("stop");
			break;
	}
});

client.login(token);
