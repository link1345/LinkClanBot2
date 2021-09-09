import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';
import { chat } from 'googleapis/build/src/apis/chat';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';

import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import * as google from './google_sheet'

import * as channelSend from '../../util/channel_send';

export class main extends PluginBase  {
	
	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );
		
	}

	async ready(client: Discord.Client, config: Object){
		super.ready(client, config);
		//console.log("run memberSheet interactive!");
	}


	async MemberDataUp(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember){

		var doc : GoogleSpreadsheet = await google.getDocment(config);
		var sheet : GoogleSpreadsheetWorksheet = doc.sheetsByIndex[0];
		
		if ( !( await google.check_tabel(config, sheet) ) ){
			console.log("【ERROR】表の形式が間違っています。");
			
			/// ここに、間違っているよ！というDiscordメッセージを出す。
			for( var item of await channelSend.ChannelList(client, config["AutoEvent_ERRORMessage_channelID"]) ){
				item.send({ content: "【ERROR】表の形式が間違っています。" });
			}
			
		}

		// displayName
		if(oldMember.displayName != newMember.displayName){

		}

		// role
		var old_member_role = oldMember.roles.cache.map(role => role.id);
		var new_member_role = newMember.roles.cache.map(role => role.id);
		var old_item = old_member_role.filter(item => new_member_role.indexOf(item) == -1);
		var new_item = new_member_role.filter(item => old_member_role.indexOf(item) == -1);

		
		// name
		if(oldMember.user.username != newMember.user.username){

		}

		// discriminator
		if(oldMember.user.discriminator != newMember.user.discriminator){

		}

		// discriminator
		if(oldMember.user.id != newMember.user.id){

		}
	}


	async guildMemberUpdate(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember ){
		//console.log("run guildMemberUpdate interactive!");
		console.log(  oldMember.displayName , " => " , newMember.displayName );

		this.MemberDataUp(client, config, oldMember, newMember);


	}

}