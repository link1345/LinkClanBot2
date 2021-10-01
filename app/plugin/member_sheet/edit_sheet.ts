import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';


import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import * as google from './google_sheet'

import * as fChannle from '../../util/channel_send';

import {getType} from './interactive';
import { send } from 'process';

function discordDataPoint(config){
	var discord_list = [
		"discord.Member.id",
		"discord.Member.role", 
		"discord.Member.name",
		"discord.Member.display_name",
		"discord.Member.discriminator",
		"text",
	];

	// 各項目がどこにあるのかを確認。
	var tabel_discordDataPoint = new Object();
	for(var discord_item of discord_list){
		tabel_discordDataPoint[ String(discord_item) ] = [];
		for(var index in config["SheetIndex"]){
			if( discord_item === config["SheetIndex"][index]["type"] ){
				this.tabel_discordDataPoint[ String(discord_item) ].push( index );
			}
		}
	}
	return tabel_discordDataPoint;
}


export async function EditSheet(client: Discord.Client, config: Object, editUser: Discord.User, interaction: Discord.CommandInteraction){
	try{
		await interaction.reply("【報告】名簿編集中...");

		var indexPoint = getType("text",config["SheetIndex"]);
		var IDPoint = getType("discord.Member.id",config["SheetIndex"]);
		if ( IDPoint == null ) {
			await interaction.editReply("【ERROR】なんか名簿がおかしいみたい。管理者に相談してね！");
			return false;
		};

		var valueList : Array<string> = Array( config["SheetIndex"].length );
		for( var index of indexPoint ){
			var name = config["SheetIndex"][index]["name"];
			var interaction_name = interaction.options.get( name );
			if(interaction_name == null || interaction_name.value == ""){
				/// コメントアウトされているこの文は、記入されていない欄は削除するという内容のもの…が、discordの仕様上割と面倒な感じになっているので、今の所無効化
				///console.log(index);
				///indexPoint = indexPoint.filter(n => n !== index);
				continue;
			}
			valueList[index] = interaction_name.value as string ;
		}
		console.log(indexPoint);

		if(valueList.length === 0) return;

		
		var doc : GoogleSpreadsheet = await google.getDocment(config);
		var sheet : GoogleSpreadsheetWorksheet = doc.sheetsByIndex[0];

		var id_point = IDPoint[0];

		// 既にあるユーザ検索して、操作。
		var user_point = await google.getUserPoint(sheet, id_point , editUser.id);
		if(user_point == -1){
			await interaction.editReply("【ERROR】" + fChannle.text_check(editUser.username) + "#" + fChannle.text_check(editUser.discriminator) + "さんは名簿に存在しないみたい...。管理者に相談してね！");
			return false;
		}

		// ここで編集
		await sheet.loadCells({
			startRowIndex: user_point,
			startColumnIndex:0 , endColumnIndex: sheet.columnCount
		});

		for( var index of indexPoint ){
			var cell = sheet.getCell(user_point, index);
			//console.log("cell1  ==  " , cell.value);

			if( valueList[index] !== cell.value ){
				cell.value = valueList[index];
			}
		}
		await sheet.saveUpdatedCells();
		

		var send_embed : Discord.MessageEmbed = new Discord.MessageEmbed() ;
		send_embed.setTitle("【設定されたデータ】");
		send_embed.setURL(config["SPREADSHEET_URL"]);
		send_embed.setDescription(fChannle.text_check(editUser.username) + "#" + fChannle.text_check(editUser.discriminator) + "さんのデータ情報");
		for( var index of indexPoint ){
			
			var item = valueList[index];
			if ( valueList[index] == null || valueList[index] == "" ){
				item = "( undefined )";
			}
			send_embed.addField( config["SheetIndex"][index]["description"], item);
		}

		var ReplyMessage : Discord.WebhookEditMessageOptions = {
			content: "【報告】" + fChannle.text_check(editUser.username) + "#" + fChannle.text_check(editUser.discriminator) + "さんのデータを更新したよ！乙！",
			embeds:[ send_embed ]
		}

		await interaction.editReply( ReplyMessage );
	}catch(error){
		console.error(error);
	}

	return true;
}
