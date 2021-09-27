
import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';
import * as cron from 'node-cron';

import * as fs from 'fs';
import * as yaml from 'js-yaml';

import {PluginBase} from '../../util/plugin_base';

import * as channelSend from '../../util/channel_send';

import * as vote_f from './vote_time';

export class main extends PluginBase {

	VoteData : Array<Object>;

	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );

		this.VoteData = [];
	}

	async ready(client: Discord.Client, config: Object){
		await super.ready(client, config);

		// 稼働中の投票欄を読み込む
		await vote_f.init_VoteCommand_subject_vote(config);
	}

	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		//if (!interaction.isCommand()) return;

		if( interaction.isCommand() && interaction.commandName === "vote_opon" ){
			if(!await channelSend.Command_permison_check(client, interaction, config)) return;

			await vote_f.setVote(client, config, interaction);

		}else if( interaction.isCommand() && interaction.commandName === "vote_info" ){
			if(!await channelSend.Command_permison_check(client, interaction, config)) return;

		}else if( interaction.isCommand() && interaction.commandName === "vote_close" ){
			if(!await channelSend.Command_permison_check(client, interaction, config)) return;

		}else if( interaction.isCommand() && interaction.commandName === "vote_edit" ){
			if(!await channelSend.Command_permison_check(client, interaction, config)) return;

			await vote_f.editVote(client, config, interaction);

		}else if( interaction.isSelectMenu()  ){
			console.log("interaction   " , interaction);

			await vote_f.getSelectMenu(client, config, interaction);
		}

	}


}