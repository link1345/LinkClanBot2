import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';

import * as google from './google_sheet'

import * as eSheet from './edit_sheet'
import {init_Set_SheetCommand} from './interactive';

export class main extends PluginBase  {
	
	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );
		
	}

	async ready(client: Discord.Client, config: Object){
		await super.ready(client, config);
		await init_Set_SheetCommand(PluginBase.commandList, config, 'admin-edit-memberlist');
		// ここで追加して、このコマンドでは、ユーザー指定が必要であるという旨を書く。
	}

	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		if (!interaction.isCommand()) return;

		if( interaction.commandName === "admin-edit-memberlist" ){
			/// 下の奴だけだと、書いた本人が名乗ると言う形になってしまうので、細工して。
			//await eSheet.EditSheet(client, config, interaction.user, interaction);
		}
	}

}