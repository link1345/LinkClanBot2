import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';


export class main extends PluginBase {

	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );

	}

	async interactionCreate(client, config, interaction){
		if (!interaction.isCommand()) return;
		
		if (interaction.commandName === 'ping') {
			await interaction.reply('Pong!');
		}
	}


}