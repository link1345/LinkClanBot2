import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

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