require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({autoReconnect:true, intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]});

//randomStartStop
const cp = require('child_process');
var child = cp.fork('./randomStartStop.js');

var connection = undefined;
var token = process.env.TOKEN;
var app_id = process.env.APP_ID;
var sound_dir = process.env.SOUND_DIR;
var prefix = process.env.PREFIX;
var befehl = '';
var fs = require('fs');


client.once('ready', () => {
	console.log('Hello there!');
});


//child listener
child.on('message', (data) => {
	client.channels.cache.get(app_id).send('?random');
})

//Entrance und Leavesounds
client.on('voiceStateUpdate', async (oldMemeber, newMember) => {
  let newUserChannel = newMember.channel
  let oldUserChannel = oldMemeber.channel

	//er selbst zählt nicht
	if(newMember.member.user.username === 'Johnny Cash the 3rd'){
		return;
	}

	//Jemand ist dem Voicechat beigetreten
	if(oldUserChannel !== newUserChannel && newUserChannel !== null){
		console.log('play '+newMember.member.user.username+'.mp3');

		//beitritt zum Voicechat, falls nicht schon drinnen
		connection = await newUserChannel.join();
		//sound
		const dispatcher = connection.play(sound_dir+newMember.member.user.username+'.mp3');

	}

	if(newUserChannel === null){
		connection = await oldUserChannel.join();
		const dispatcher = connection.play(sound_dir+'rave.mp3');

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
