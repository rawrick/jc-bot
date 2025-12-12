require("dotenv").config();
const fs = require('fs');

// Child process for random sound playing
const { fork } = require("child_process");
const child = fork("./randomStartStop.js");

// Discord.js imports
const { Client, GatewayIntentBits, Events } = require("discord.js");
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	AudioPlayerStatus,
} = require("@discordjs/voice");

// Config Environment Variables
const token = process.env.TOKEN;
const sound_dir = process.env.SOUND_DIR;
const prefix = process.env.PREFIX;
const audio_format = process.env.AUDIO_FORMAT || "mp3";
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
}

// Play sound file
function playSound(filename) {
	// Construct full path
	let fullPath = sound_dir + filename;
	if (!filename.endsWith("." + audio_format)) {
		fullPath += "." + audio_format;
	}

	// Check if file exists
	if (!fs.existsSync(fullPath)) {
		console.log("Missing sound:", fullPath);
		return;
	}

	// Create and play resource
	const resource = createAudioResource(fullPath);
	player.play(resource);
	console.log("Playing:", filename + "." + audio_format);
}

// Function to play a random sound
function playRandomSound() {
	// List all sound files
	const files = fs.readdirSync(sound_dir).filter(f => f.endsWith(audio_format));
	if (files.length === 0) return;
	// Select a random file
	const randomFile = files[Math.floor(Math.random() * files.length)];
	playSound(randomFile);
	console.log("Playing random sound");
}

// Ready startup message
client.once(Events.ClientReady, () => {
	console.log(`Logged in as ${client.user.tag}`);
	console.log('Hello there!');
});

// Listen for messages from child process
child.on("message", (msg) => {
	if (msg === 'randomSound') {
		playRandomSound();
		console.log("Playing random sound (child process)");
	}
})

// Entrance and Leave sounds
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
	let oldChannel = oldState.channel
	let newChannel = newState.channel
	const user = newState.member.user;

	// Ignore self
	if (user.id === client.user.id) return;

	// User joins a channel
	if (oldChannel !== newChannel && newChannel !== null) {
		await joinVoice(newChannel);
		playSound(user.username); // SAFER: use ID
		console.log(`User ${user.id} joining. Playing ${user.username}.mp3`);
	}

	// User leaves a channel
	if (newChannel === null) {
		await joinVoice(oldChannel);
		playSound(user_leave);
		console.log(`User ${user.id} leaving. Playing ${user_leave}.mp3`);
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

	// Random Sound Command
	if (command === "random") {
		playRandomSound();
	}

	// Start random Playback
	else if (text === "rStart") {
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
})

client.login(token);
