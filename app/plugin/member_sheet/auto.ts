import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';
import { chat } from 'googleapis/build/src/apis/chat';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';

import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import * as google from './google_sheet'

import * as channelSend from '../../util/channel_send';
import { sheets } from 'googleapis/build/src/apis/sheets';

import * as chart from '../voice_log/chart';
import * as cron from 'node-cron';
import { memoryUsage } from 'process';

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
			"discord.Member.role.lasttime",
			"text",
		];

		for(var i = 0; i <= 12 ; i++){ // 0 ~ 12
			discord_list.push( "discord.time." + String(i) );
		}

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

		
		cron.schedule('0 0 0 1,15,18 * *', () => this.sheet_periodic_output());
	}


	// 月一で、名簿全検索を行う。
	// と言うのは名目上で、
	async sheet_periodic_output(){

		var channels = await channelSend.ChannelList(this.fix_client, this.config["Periodic_output_Channel"] );
		
		if(channels.length != 0)
			var channel = channels[0];

		var message : Discord.Message;
		if(channels.length != 0)
			message = await channel.send("**【定期:名簿更新 ⇒ 処理中】**少々お待ちください。" + channelSend.text_check("_(:3」∠)_") );

		//console.log( this.tabel_discordDataPoint["discord.Member.role"] );
		var member_list = await this.getMemberList(this.fix_client, this.config);

		if(channels.length != 0)
			await message.edit("**【定期:名簿更新 ⇒ 処理中】**現時点での存在する人の処理中" + channelSend.text_check("(;´･ω･)") );
		
		await this.setSheetData_no1(this.fix_client, this.config, member_list);
		
		if(channels.length != 0)
			await message.edit("**【定期:名簿更新 ⇒ 処理中】**名簿記載メンバーではない人の削除中" + channelSend.text_check("(´；ω；｀)ｳｯ…") );

		// 名簿に存在しているが、名簿記載メンバーではない人の削除
		await this.NullMemberDelete(this.fix_client, this.config, member_list);
		
		if(channels.length != 0)
			await message.edit("**【定期:名簿更新 ⇒ 報告】**整合性調査が終わりました。" + channelSend.text_check("＼(^o^)／ｵﾜﾀ") );

	}


	async ready(client: Discord.Client, config: Object){
		await super.ready(client, config);
		//console.log("run memberSheet interactive!");
	}


	// oldMemberをnullにすると、IDを検索して全修正を掛けてくれます。
	private async MemberDataUp(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember, filepath_list_oldMonth: Array<string> = null){
		try{

		if( this.tabel_discordDataPoint["discord.Member.id"].length === 0 ){		
			console.log("【ERROR】IDを記載する列がありません。");
			
			/// ここに、間違っているよ！というDiscordメッセージを出す。
			for( var item of await channelSend.ChannelList(client, config["AutoEvent_ERRORMessage_channelID"]) ){
				item.send({ content: "【ERROR】IDを記載する列がありません。" });
			}
		}

		// ------------

		var setData = new Array( config["SheetIndex"].length );
		var CheckData = new Array( config["SheetIndex"].length );
		for(var d = 0; d < setData.length ;d++){
			setData[d] = "";
			CheckData[d] = false;
		}

		// role
		var old_member_role : Array<string> = [] ;
		if (oldMember != null)
			old_member_role = oldMember.roles.cache.map(role => role.id);
		var new_member_role = newMember.roles.cache.map(role => role.id);

		// 編集する必要があるメンバーか？
		//   ついでに、ロール処理もしておく。
		var newMemberFlag = false;
		var deleteMemberFlag = false;

		var RoleHitCount = 0;
		var old_RoleHitCount = 0;

		for( var index of this.tabel_discordDataPoint["discord.Member.role"] ){
			var old_item : Array<string> = [];
			if(oldMember != null) old_item = old_member_role.filter(item => config["SheetIndex"][index]["roles"].indexOf(item) == -1);
			//var old_item = old_member_role.filter(item => config["SheetIndex"][index]["roles"].indexOf(item) == -1);
			var new_item = new_member_role.filter(item => config["SheetIndex"][index]["roles"].indexOf(item) == -1);

			//console.log(config["SheetIndex"][index]["roles"]);
			//console.log(index);
			//console.log(new_item);
			/*
			if( old_item.length === 0 ){
				newMemberFlag = true;
			}else if( new_item.length === 0 ){
				deleteMemberFlag = true;
			}*/

			if( new_item.length !== new_member_role.length ){
				setData[index] = "〇";
				CheckData[index] = true;
				RoleHitCount += 1;
			}else{
				setData[index] = "";
				CheckData[index] = true;
			}

			// 下の処理は、チェックだけの場合は、要らないので飛ばす。
			if(oldMember == null){
				old_RoleHitCount = 1; // 今回、差分チェックで全部確認しておく必要があるので、強制的に動くようにする。
				continue;
			}

			if( old_item.length !== old_member_role.length ){
				old_RoleHitCount += 1;
			}

			// 新規追加
			if( new_item.length !== new_member_role.length &&  old_item.length === old_member_role.length ){

				// ロール 新規追加履歴を記録。
				for( var lasttime_index of this.tabel_discordDataPoint["discord.Member.role.lasttime"] ){
					var last_date = new Date();

					var year  = last_date.getFullYear();
					var month = ("0"+ Number(last_date.getMonth() + 1) ).slice(-2);
					var day   = ("0"+last_date.getDate() ).slice(-2);

					setData[lasttime_index] = String( year ) + "/" + String(month) + "/" + String(day);
					CheckData[lasttime_index] = true;
				}

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
				if( config["SheetIndex"][index]["DeleteMessage"] !== "" ){
					var text : string = "**【自動通知】**" + channelSend.text_check(newMember.displayName) + config["SheetIndex"][index]["DeleteMessage"] ;
				
					for( var item of await channelSend.ChannelList(client, config["AutoEvent_Message_channelID"]) ){
						item.send({ content: text });
					}
				}
			}

		}

		// 前のロール・今のロールに該当がない場合は、処理しない。
		if(old_RoleHitCount === 0 && RoleHitCount === 0) return false;
		
		// 前のロールは存在するが、今のロールに該当がない場合は、名簿から削除。
		if(RoleHitCount === 0) deleteMemberFlag = true;

		// displayName
		for( var index of this.tabel_discordDataPoint["discord.Member.display_name"] ){
			setData[index] = newMember.displayName;
			CheckData[index] = true;
		}
		if( oldMember != null && (oldMember.displayName != newMember.displayName) ){
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
		if( oldMember != null && (oldMember.user.username != newMember.user.username) ){
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
		// ID
		//if(oldMember.user.id != newMember.user.id){
			for( var index of this.tabel_discordDataPoint["discord.Member.id"] ){
				setData[index] = String(newMember.user.id);
				CheckData[index] = true;
			}
		//}

		// 時間取得
		// time
		//if(oldMember.user.id != newMember.user.id){
			// ユーザーリスト作成(とっても、自分だけだけど...)
			var user_list : Discord.Collection<string, Discord.GuildMember> = new Discord.Collection ;
			user_list.set(newMember.user.id, newMember as Discord.GuildMember);

			// ファイルリスト作成
			if(filepath_list_oldMonth == null){
				var oldlist = await chart.most_oldMonth( config["output_TimeLine_folderpath"] );
				filepath_list_oldMonth = oldlist["fileList"];
				filepath_list_oldMonth.unshift(config["output_TimeLine_filepath"]);
			}

			for( var i = 0; i <= 12 && i < filepath_list_oldMonth.length-1 ; i++){

				for( var index of this.tabel_discordDataPoint["discord.time." + i] ){

					//
					var timeData = await chart.one_MakeTimeList(client, filepath_list_oldMonth[i], user_list);
					var user_time = timeData.values[0][2];

					if( user_time == null || user_time <= 0.0 ){
						setData[index] = "null";
						continue;
					}else{		
						//var round_user_time = Math.round(user_time * 100) / 100;
						//setData[index] = round_user_time;	
						setData[index] = user_time;					
					}
					//setData[index] = String(newMember.user.id);
					CheckData[index] = true;
				}
			}
		//}

		console.log("setData  " , setData);

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
		if( newMemberFlag === false && deleteMemberFlag === false ){

			var user_point = null;
			if( oldMember == null) user_point = await google.getUserPoint(sheet, id_point, newMember.user.id);
			else user_point = await google.getUserPoint(sheet, id_point, oldMember.user.id);

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
							cell.textFormat = {bold: false}; // 今の所、名簿の全データは文字列として保管。
							
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
			var user_point = null;
			if( oldMember == null) user_point = await google.getUserPoint(sheet, id_point, newMember.user.id);
			else user_point = await google.getUserPoint(sheet, id_point, oldMember.user.id);

			if(user_point !== -1){
				const rows = await sheet.getRows();
				var row = rows[user_point-1];
				await row.delete();
			}

		}

		}catch(error){
			console.log(error);
		}

		return true;
	}

	private async MemberDelete(client: Discord.Client, config: Object, Member:Discord.GuildMember){
		
		if( this.tabel_discordDataPoint["discord.Member.id"].length === 0 ){		
			console.log("【ERROR】IDを記載する列がありません。");
			
			/// ここに、間違っているよ！というDiscordメッセージを出す。
			for( var item of await channelSend.ChannelList(client, config["AutoEvent_ERRORMessage_channelID"]) ){
				item.send({ content: "【ERROR】IDを記載する列がありません。" });
			}
		}

		// ------------
		var id_point = this.tabel_discordDataPoint["discord.Member.id"][0];
		
		var doc : GoogleSpreadsheet = await google.getDocment(config);
		var sheet : GoogleSpreadsheetWorksheet = doc.sheetsByIndex[0];

		// ここで削除
		var user_point = await google.getUserPoint(sheet, id_point, Member.user.id);
		if(user_point != -1){
			const rows = await sheet.getRows();
			var row = rows[user_point-1];
			//console.log(row);
			await row.delete();
		}

		return true;
	}


	private async NullMemberDelete(client: Discord.Client, config: Object, Members: Discord.Collection<string, Discord.GuildMember>) {
		
		var id_point = this.tabel_discordDataPoint["discord.Member.id"][0];
		var doc : GoogleSpreadsheet = await google.getDocment(config);
		var sheet : GoogleSpreadsheetWorksheet = doc.sheetsByIndex[0];

		// ここで削除
		var database_UserList = await google.getUserList(sheet, id_point);
		var discode_UserList = Members.map(member => member.id);

		//database_UserList.
		//console.log("database_UserList >> " , database_UserList );
		var delete_item = database_UserList.filter(item => discode_UserList.indexOf(item) == -1);
		//console.log(delete_item);
		delete_item.reverse();
		for(var item of delete_item){
			var user_point = database_UserList.indexOf(item);
			//console.log(user_point);
			if(user_point != -1){
				const rows = await sheet.getRows();
				var row = rows[user_point];
				//console.log(row);
				await row.delete();
			}
		}


	}



	async guildMemberUpdate(client: Discord.Client, config: Object, oldMember:Discord.GuildMember, newMember:Discord.GuildMember ){
		//console.log("run guildMemberUpdate interactive!");
		this.MemberDataUp(client, config, oldMember, newMember);
	}

	async guildMemberRemove(client: Discord.Client, config: Object, Member:Discord.GuildMember ){
		//console.log("run guildMemberRemove interactive!");
		this.MemberDelete(client, config, Member);
	}

	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		if (!interaction.isCommand()) return;
		
		if( interaction.commandName === "check-consistency" ){
			//try{

			await interaction.reply("【報告】少々お待ちください。" + channelSend.text_check("_(:3」∠)_") );

			//console.log( this.tabel_discordDataPoint["discord.Member.role"] );
			var member_list = await this.getMemberList(client, config);

			await interaction.editReply("【報告】現時点での存在する人の処理中" + channelSend.text_check("(;´･ω･)") );
			
			await this.setSheetData_no1(client, config, member_list);

			await interaction.editReply("【報告】名簿記載メンバーではない人の削除中" + channelSend.text_check("(´；ω；｀)ｳｯ…") );

			// 名簿に存在しているが、名簿記載メンバーではない人の削除
			await this.NullMemberDelete(client,config, member_list);

			await interaction.editReply("【報告】整合性調査が終わりました。" + channelSend.text_check("＼(^o^)／ｵﾜﾀ") );

		//}catch(error){
		//	console.log(error);
		//}

		}
	}

	private async getMemberList(client: Discord.Client, config: Object): Promise< Discord.Collection<string, Discord.GuildMember> >{
		var member_list : Discord.Collection<string, Discord.GuildMember> = new Discord.Collection;

		await client.guilds.fetch();
		var guild = client.guilds.cache.map(guild => guild);

		for(var guild_item of guild ){
			await guild_item.roles.fetch();

			for( var database_Point of this.tabel_discordDataPoint["discord.Member.role"] ){
				for( var database_role of config["SheetIndex"][ Number(database_Point) ]["roles"]){
					console.log("role number : " , database_role );
					var t_item = guild_item.roles.cache.filter(role => role.id == database_role).map(role => role.members);
					console.log("member data : " , t_item );
					for( var item of t_item ){
						member_list = member_list.concat( item );
					}
				}
			}	
		}
		return member_list;
	}

	private async setSheetData_no1(client: Discord.Client , config: Object, member_list: Discord.Collection<string, Discord.GuildMember>){
		// 一度に調査する場合は、事前にファイルリストを作って置く。
		var oldlist = await chart.most_oldMonth( config["output_TimeLine_folderpath"] );
		var filepath_list_oldMonth = oldlist["fileList"];
		filepath_list_oldMonth.unshift(config["output_TimeLine_filepath"]);

		// 現時点で存在する人の調査
		for(var member of member_list.values()){
			await member.fetch();
			//console.log("member name : " , member.displayName);
			await this.MemberDataUp(client, config, null, member, filepath_list_oldMonth);
		}
	}


}