require("dotenv").config();
const fs = require('fs');

// 
const { getEntranceSound } = require("./helpers/entranceLoader");
const {printJoinSoundTable} = require("./helpers/IDLogs");

// Child process for random sound playing
const { fork } = require("child_process");
const child = fork("./helpers/randomStartStop.js");

// Discord.js imports
const { Client, GatewayIntentBits, Events } = require("discord.js");
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	entersState
} = require("@discordjs/voice");

// Config Environment Variables
const token = process.env.TOKEN;
const sound_dir = process.env.SOUND_DIR;
const prefix = process.env.PREFIX;
const audio_format = process.env.AUDIO_FORMAT || "mp3";
const user_join_default = process.env.USER_JOIN_DEFAULT || "sus3";
const user_leave = process.env.USER_LEAVE || "rave";

// Create Discord Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent
	]
});

// Voice player
let connection = null;
const player = createAudioPlayer();
player.on(AudioPlayerStatus.Idle, () => { }); // Auto-resubscribe connection after idle

// Join voice
async function joinVoice(channel) {
	if (!channel) return;

	connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator
	});

	connection.subscribe(player);

	// Handle connection errors
	connection.on("error", (err) => {
		console.error("Voice connection error:", err.message);
	});

	// Auto-reconnect logic
	connection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
			]);
			console.log("Voice reconnected");
		} catch {
			console.log("Voice connection lost, destroying");
			connection.destroy();
			connection = null;
		}
	});
};

// Play sound file
function playSound(filename) {
	if (!filename.endsWith("." + audio_format)) {
		filename += "." + audio_format;
	}
	// Construct full path
	let fullPath = sound_dir;
	fullPath += filename;

	// Check if file exists
	if (!fs.existsSync(fullPath)) {
		console.log("File does not exist:", filename);
		return;
	}

	// Create and play resource
	const resource = createAudioResource(fullPath);
	player.play(resource);
	console.log("Playing:", filename);
};

// Function to play a random sound
function playRandomSound() {
	// List all sound files
	const files = fs.readdirSync(sound_dir).filter(f => f.endsWith(audio_format));
	if (files.length === 0) return;
	// Select a random file
	const randomFile = files[Math.floor(Math.random() * files.length)];
	console.log("Selected random sound file:", randomFile);;
	playSound(randomFile);
};

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
		playSound(sound);
	}

	// User leaves a channel
	if (newChannel === null) {
		await joinVoice(oldChannel);
		console.log("User left:", user.username, user.id);
		playSound(user_leave);
	}
});

// Prefix Commands
client.on(Events.MessageCreate, async (message) => {
	// Ignore bot messages
	if (message.author.bot) return;
	// Ignore messages without prefix
	if (!message.content.startsWith(prefix)) return;

	const text = message.content;
	const command = text.substring(prefix.length);

	// Join VC of message author
	if (message.member.voice.channel) {
		await joinVoice(message.member.voice.channel);
	}

	//
	if (command === "getID") {
		console.log()
		printJoinSoundTable();
	}

	// Random Sound Command
	if (command === "random") {
		playRandomSound();
	}

	// Start random Playback
	else if (command === "rStart") {
		child.send("start");
	}

	// Stop random Playback
	else if (command === "rStop") {
		child.send("stop");
	}

	// Play matching sound file
	else {
		playSound(command);
	}
});

client.login(token);
