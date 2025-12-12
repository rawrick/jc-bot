require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]});
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require("@discordjs/voice");

let connection = null;
let player = createAudioPlayer();

// Auto-resubscribe connection after idle
player.on(AudioPlayerStatus.Idle, () => {});

//randomStartStop
const cp = require('child_process');
var child = cp.fork('./randomStartStop.js');

var token = process.env.TOKEN;
var app_id = process.env.APP_ID;
var sound_dir = process.env.SOUND_DIR;
var prefix = process.env.PREFIX;
var befehl = '';
var fs = require('fs');

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

// Play an MP3 file
function playSound(filename) {
    const fullPath = sound_dir + filename;
    if (!fs.existsSync(fullPath)) {
        console.log("Missing sound:", fullPath);
        return;
    }

    const resource = createAudioResource(fullPath);
    player.play(resource);
}

// Function to play a random sound
function playRandomSound() {
    const files = fs.readdirSync(sound_dir).filter(f => f.endsWith(".mp3"));
    if (files.length === 0) return;
    const randomFile = files[Math.floor(Math.random() * files.length)];
    playSound(randomFile);
}

client.once('clientReady', () => {
	console.log('Hello there!');
	console.log(`Logged in as ${client.user.tag}`);
});

//child listener
child.on("message", (msg) => {

    if (msg === 'randomSound') {
		console.log('Playing random sound from child process');
		playRandomSound();
	}
})

//Entrance und Leavesounds
client.on('voiceStateUpdate', async (oldState, newState) => {
  let oldChannel = oldState.channel
  let newChannel  = newState.channel
  const user = newState.member.user;

	//er selbst zählt nicht
	if (user.id === client.user.id) return;

	//Jemand ist dem Voicechat beigetreten
	if(oldChannel  !== newChannel  && newChannel  !== null){
		console.log('play '+user.username+'.mp3');

		//beitritt zum Voicechat, falls nicht schon drinnen
		await joinVoice(newChannel);
		//sound
		playSound(user.username + ".mp3"); // SAFER: use ID

	}

	if(newChannel  === null){
		await joinVoice(oldChannel);
		playSound("rave.mp3");

	}


	});


//Listen for messages
client.on(Events.MessageCreate, async (message) => {

	// Ignore bot messages
	if (message.author.bot) return;

	const text = message.content;
	console.log('Received message:', text);

	//join dem Verfasser des Befehls
	if (message.member.voice.channel) {
		await joinVoice(message.member.voice.channel);
	}

	//RandomSounds
	if(text === prefix+'random'){
		//play random sounds
		const files = fs.readdirSync(sound_dir);
		const randomFile  = files[Math.floor(Math.random() * files.length)];
		console.log(randomSound);
		playSound(randomFile);
	}

	//random Start
	else if(text === prefix+'rStart'){
		child.send('start');
	}

	//random Start
	else if(text === prefix+'rStop'){
		child.send('stop');
	}


	//Normale Soundbefehle
  else if(text.startsWith(prefix)){
    //Titel audio
    const soundFileName = text.substring(prefix.length);
    //Verzeichnis nach Titel durchsuchen
		playSound(soundFileName+'.mp3');

  }
})

client.login(token);
