
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { Client, Intents } = require('discord.js');

export class main  {
	constructor(){

	}

	//async ready(client){
	//	console.log("run voice_log interactive!");
	//}

	async interactionCreate(client, config, interaction){
		if (!interaction.isCommand()) return;
		
		if (interaction.commandName === 'ping') {
			await interaction.reply('Pong!');
		}
	}


}