import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';
import { chat } from 'googleapis/build/src/apis/chat';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';

import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import * as google from './google_sheet'

import * as channelSend from '../../util/channel_send';
<<<<<<< HEAD
=======
import { sheets } from 'googleapis/build/src/apis/sheets';
>>>>>>> ver1.0

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
<<<<<<< HEAD
		super.ready(client, config);
=======
		await super.ready(client, config);
>>>>>>> ver1.0
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
<<<<<<< HEAD
=======
		var CheckData = new Array( config["SheetIndex"].length );
		for(var d = 0; d < setData.length ;d++){
			setData[d] = "";
			CheckData[d] = false;
		}
>>>>>>> ver1.0

		// role
		var old_member_role = oldMember.roles.cache.map(role => role.id);
		var new_member_role = newMember.roles.cache.map(role => role.id);

		// 編集する必要があるメンバーか？
		//   ついでに、ロール処理もしておく。
<<<<<<< HEAD
		var hitFlag = true;
		var newMemberFlag = false;
		var deleteMemberFlag = false;
=======
		var newMemberFlag = false;
		var deleteMemberFlag = false;

		var RoleHitCount = 0;
		var old_RoleHitCount = 0;

>>>>>>> ver1.0
		for( var index of this.tabel_discordDataPoint["discord.Member.role"] ){
			var old_item = old_member_role.filter(item => config["SheetIndex"][index]["roles"].indexOf(item) == -1);
			var new_item = new_member_role.filter(item => config["SheetIndex"][index]["roles"].indexOf(item) == -1);

<<<<<<< HEAD
=======
			//console.log(config["SheetIndex"][index]["roles"]);
			//console.log(index);
			//console.log(new_item);
			/*
>>>>>>> ver1.0
			if( old_item.length === 0 ){
				newMemberFlag = true;
			}else if( new_item.length === 0 ){
				deleteMemberFlag = true;
<<<<<<< HEAD
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
=======
			}*/

			if( new_item.length !== new_member_role.length ){
				setData[index] = "〇";
				CheckData[index] = true;
				RoleHitCount += 1;
			}else{
				setData[index] = "";
				CheckData[index] = true;
			}

			if( old_item.length !== old_member_role.length ){
				old_RoleHitCount += 1;
			}

			// 新規追加
			if( new_item.length !== new_member_role.length &&  old_item.length === old_member_role.length ){
				var text : string = "";
				if(config["SheetIndex"][index]["AddMessage"] !== ""){
					text = "**【自動通知】**" + channelSend.text_check(newMember.displayName) + channelSend.text_check(config["SheetIndex"][index]["AddMessage"]) ;
					console.log(text);
					for( var item of await channelSend.ChannelList(client, config["AutoEvent_Message_channelID"]) ){
						console.log(item);
						item.send({ content: text });
					}
				}
			}
			// 剥奪
			else if( new_item.length === new_member_role.length &&  old_item.length !== old_member_role.length ){
				var text : string = "【自動通知】" + channelSend.text_check(newMember.displayName) + config["SheetIndex"][index]["DeleteMessage"] ;
				text = channelSend.text_check(text);

				for( var item of await channelSend.ChannelList(client, config["AutoEvent_Message_channelID"]) ){
					item.send({ content: text });
				}
			}

		}
		if(old_RoleHitCount === 0 && RoleHitCount === 0) return false;
		if(RoleHitCount === 0) deleteMemberFlag = true;

		// displayName
		for( var index of this.tabel_discordDataPoint["discord.Member.display_name"] ){
			setData[index] = newMember.displayName;
			CheckData[index] = true;
		}
		if(oldMember.displayName != newMember.displayName){
			text = "**【自動通知】**" + channelSend.text_check(oldMember.displayName) + "さんが、名前を変えて..." + channelSend.text_check(newMember.displayName) + "になりました。" ;
			console.log(text);
			for( var item of await channelSend.ChannelList(client, config["AutoEvent_Message_channelID"]) ){
				console.log(item);
				item.send({ content: text });
			}
		}
		// name
		for( var index of this.tabel_discordDataPoint["discord.Member.name"] ){
			setData[index] = newMember.user.username;
			CheckData[index] = true;
		}
		if(oldMember.user.username != newMember.user.username){
			text = "**【自動通知】**" + channelSend.text_check(oldMember.user.username) + "さんが、システム名前を変えて...  " + channelSend.text_check(newMember.user.username) + "になりました。" ;
			console.log(text);
			for( var item of await channelSend.ChannelList(client, config["AutoEvent_Message_channelID"]) ){
				console.log(item);
				item.send({ content: text });
			}
		}
		// discriminator
		//if(oldMember.user.discriminator != newMember.user.discriminator){
			for( var index of this.tabel_discordDataPoint["discord.Member.discriminator"] ){
				setData[index] = String(newMember.user.discriminator);
				CheckData[index] = true;
			}
		//}
		// discriminator
		//if(oldMember.user.id != newMember.user.id){
			for( var index of this.tabel_discordDataPoint["discord.Member.id"] ){
				setData[index] = String(newMember.user.id);
				CheckData[index] = true;
			}
		//}

		console.log("setData  " , setData);
>>>>>>> ver1.0

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
<<<<<<< HEAD
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

=======
		if( newMemberFlag === false && deleteMemberFlag === false ){

			var user_point = await google.getUserPoint(sheet, id_point, oldMember.user.id);

			if(user_point == -1) newMemberFlag = true;			
			// ここで編集
			else{

				await sheet.loadCells({
					startRowIndex: user_point,
					startColumnIndex:0 , endColumnIndex: sheet.columnCount
				});

				for(var x = 0; x < CheckData.length; x++){

					if( CheckData[x] == true ){
						var cell = sheet.getCell(user_point, x);
						//console.log("cell1  ==  " , cell.value);

						if(setData[x] !== cell.value ){
							cell.value = setData[x];
						}
					}
					await sheet.saveUpdatedCells();

				}

			}
		}
		// ここで追加
		if ( newMemberFlag == true ){
			await sheet.addRow(setData);
			await sheet.saveUpdatedCells();
		}
		// ここで削除
		else if( deleteMemberFlag == true ){
				
			var user_point = await google.getUserPoint(sheet, id_point, oldMember.user.id);
			if(user_point !== -1){
				const rows = await sheet.getRows();
				var row = rows[user_point-1];
				//console.log(row);
				await row.delete();
			}

		}
		return true;
>>>>>>> ver1.0
	}


	async guildMemberUpdate(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember ){
		//console.log("run guildMemberUpdate interactive!");
<<<<<<< HEAD
		console.log(  oldMember.displayName , " => " , newMember.displayName );

		this.MemberDataUp(client, config, oldMember, newMember);


=======
		this.MemberDataUp(client, config, oldMember, newMember);
>>>>>>> ver1.0
	}

}