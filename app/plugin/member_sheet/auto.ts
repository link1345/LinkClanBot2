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
	
	tabel_discordDataPoint: Object;

	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );
		
		var discord_list = [
			"discord.Member.id",
			"discord.Member.role", 
			"discord.Member.name",
			"discord.Member.display_name",
			"discord.Member.discriminator",
			"text",
		];

		// 各項目がどこにあるのかを確認。
		this.tabel_discordDataPoint = new Object();
		for(var discord_item of discord_list){
			this.tabel_discordDataPoint[ String(discord_item) ] = [];
			for(var index in config["SheetIndex"]){
				if( discord_item === config["SheetIndex"][index]["type"] ){
					this.tabel_discordDataPoint[ String(discord_item) ].push( index );
				}
			}
		}
		//console.log( this.tabel_discordDataPoint );

	}

	async ready(client: Discord.Client, config: Object){
		super.ready(client, config);
		//console.log("run memberSheet interactive!");
	}


	private async MemberDataUp(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember){
		
		if( this.tabel_discordDataPoint["discord.Member.id"].length === 0 ){		
			console.log("【ERROR】IDを記載する列がありません。");
			
			/// ここに、間違っているよ！というDiscordメッセージを出す。
			for( var item of await channelSend.ChannelList(client, config["AutoEvent_ERRORMessage_channelID"]) ){
				item.send({ content: "【ERROR】IDを記載する列がありません。" });
			}
		}

		// ------------

		var setData = new Array( config["SheetIndex"].length );

		// role
		var old_member_role = oldMember.roles.cache.map(role => role.id);
		var new_member_role = newMember.roles.cache.map(role => role.id);

		// 編集する必要があるメンバーか？
		//   ついでに、ロール処理もしておく。
		var hitFlag = true;
		var newMemberFlag = false;
		var deleteMemberFlag = false;
		for( var index of this.tabel_discordDataPoint["discord.Member.role"] ){
			var old_item = old_member_role.filter(item => config["SheetIndex"][index]["roles"].indexOf(item) == -1);
			var new_item = new_member_role.filter(item => config["SheetIndex"][index]["roles"].indexOf(item) == -1);

			if( old_item.length === 0 ){
				newMemberFlag = true;
			}else if( new_item.length === 0 ){
				deleteMemberFlag = true;
			}

			if( new_item.length !== 0 ){
				setData[index] = "〇";
			}else{
				setData[index] = "";
			}

			if( old_item.length !== 0 || new_item.length !== 0 ){
				hitFlag = true;
			}			
		}
		if( !hitFlag ) return false;


		// displayName
		if(oldMember.displayName != newMember.displayName){
			for( var index of this.tabel_discordDataPoint["discord.Member.display_name"] ){
				setData[index] = newMember.displayName;
			}
		}
		// name
		if(oldMember.user.username != newMember.user.username){
			for( var index of this.tabel_discordDataPoint["discord.Member.name"] ){
				setData[index] = newMember.user.username;
			}
		}
		// discriminator
		if(oldMember.user.discriminator != newMember.user.discriminator){
			for( var index of this.tabel_discordDataPoint["discord.Member.discriminator"] ){
				setData[index] = newMember.user.discriminator;
			}
		}
		// discriminator
		if(oldMember.user.id != newMember.user.id){
			for( var index of this.tabel_discordDataPoint["discord.Member.id"] ){
				setData[index] = newMember.user.id;
			}
		}

		/// ----------------
		// * シート書き込み	
		var doc : GoogleSpreadsheet = await google.getDocment(config);
		var sheet : GoogleSpreadsheetWorksheet = doc.sheetsByIndex[0];
		// テーブルチェック
		if ( !( await google.check_tabel(config, sheet) ) ){
			console.log("【ERROR】表の形式が間違っています。");

			/// ここに、間違っているよ！というDiscordメッセージを出す。
			for( var item of await channelSend.ChannelList(client, config["AutoEvent_ERRORMessage_channelID"]) ){
				item.send({ content: "【ERROR】表の形式が間違っています。" });
			}
			return false;
		}

		/*
		var rows = await sheet.getRows();
		console.log(rows);

		var newUserFlag = false;
		if( rows.length === 0 ){
			newUserFlag = true;
		}*/

		var id_point = this.tabel_discordDataPoint["discord.Member.id"][0];

		// 既にあるユーザ検索して、操作。
		if( newMemberFlag == false && deleteMemberFlag == false ){

			var user_point = -1;

			sheet.loadCells({
				RowIndex: id_point,
				startColumnIndex:0, endColumnIndex: sheet.columnCount
			});

			for( var i = 0; i < sheet.columnCount ; i++ ){
				var cell = sheet.getCell(id_point, i);
				if(oldMember.user.id === cell.value) {
					user_point = i;	
					break;
				}
			}

			// ここにカキコする処理を書く。
			if(user_point == -1) newMemberFlag = true;
			else{

			}
		}
		if ( newMemberFlag == true ){

		}
		else if( deleteMemberFlag == true ){

		}



		sheet.save();
		return true;

	}


	async guildMemberUpdate(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember ){
		//console.log("run guildMemberUpdate interactive!");
		console.log(  oldMember.displayName , " => " , newMember.displayName );

		this.MemberDataUp(client, config, oldMember, newMember);


	}

}