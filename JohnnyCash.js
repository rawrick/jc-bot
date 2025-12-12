require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
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

client.once('clientReady', () => {
	console.log('Hello there!');
	console.log(`Logged in as ${client.user.tag}`);
});

//child listener
child.on('message', (data) => {
	client.channels.cache.get(app_id).send('?random');
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
client.on('message', async message => {

	//join dem Verfasser des Befehls
	if (message.member.voice.channel) {
		connection = await message.member.voice.channel.join();
	}

	//RandomSounds
	if(message.content === prefix+'random'){
		//play random sounds
		let files = fs.readdirSync(sound_dir);
		let randomSound = files[Math.floor(Math.random() * files.length)];
		console.log(randomSound);
		const dispatcher = connection.play(sound_dir+randomSound);
	}

	//random Start
	else if(message.content === prefix+'rStart'){
		child.send('start');
	}

	//random Start
	else if(message.content === prefix+'rStop'){
		child.send('stop');
	}


	//Normale Soundbefehle
  else if(message.content.startsWith(prefix)){
    //Titel audio
    befehl = message.content.substring(1);
    //Verzeichnis nach Titel durchsuchen
		const dispatcher = connection.play(sound_dir+befehl+'.mp3');

  }
})

client.login(token);
