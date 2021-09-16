import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';

import * as google from './google_sheet'

<<<<<<< HEAD
=======
import * as eSheet from './edit_sheet'
import {init_Set_SheetCommand} from './interactive';

>>>>>>> ver1.0
export class main extends PluginBase  {
	
	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );
		
	}

	async ready(client: Discord.Client, config: Object){
<<<<<<< HEAD
		super.ready(client, config);
		//console.log("run memberSheet interactive!");
	}

	async guildMemberUpdate(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember ){
		//console.log("run guildMemberUpdate interactive!");
		//console.log(  oldMember.displayName , " => " , newMember.displayName );
=======
		await super.ready(client, config);

		// ここで、SheetIndexのtype:text一覧を自動に取得し、設定できるように細工
		await init_Set_SheetCommand(PluginBase.commandList, config, 'edit-memberlist');
>>>>>>> ver1.0
	}

	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		if (!interaction.isCommand()) return;
<<<<<<< HEAD
=======

		if( interaction.commandName === "edit-memberlist" ){			
			await eSheet.EditSheet(client, config, interaction.user, interaction);
		}
>>>>>>> ver1.0
	}

}