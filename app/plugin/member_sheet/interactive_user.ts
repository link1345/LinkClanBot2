import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';

import * as google from './google_sheet'

export class main extends PluginBase  {
	
	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );
		
	}

	async ready(client: Discord.Client, config: Object){
		super.ready(client, config);
		//console.log("run memberSheet interactive!");
	}

	async guildMemberUpdate(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember ){
		//console.log("run guildMemberUpdate interactive!");
		//console.log(  oldMember.displayName , " => " , newMember.displayName );
	}

	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		if (!interaction.isCommand()) return;
	}

}