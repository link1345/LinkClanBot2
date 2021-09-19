import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';
import * as cron from 'node-cron';

import {PluginBase} from '../../util/plugin_base';
import * as chart from './chart';
import { copyFileSync } from 'fs';

import * as dfd from 'danfojs-node';
import { chat } from 'googleapis/build/src/apis/chat';


import * as channelSend from '../../util/channel_send';

export class main extends PluginBase {

	oldMonthList : Object ;
	//cron_init_setCommand ;

	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );

		this.oldMonthList = {};
		//this.cron_init_setCommand;

		cron.schedule('0 0 0 * * *', () => console.log('test minute0 -----------'));
		cron.schedule('0 0 0 * * *', () => this.init_checkCommand(this.config).then() );
		
	}


	async ready(client: Discord.Client, config: Object){
		await super.ready(client, config);
		if ( await this.init_checkCommand(config) ){
			console.log("********* OK!!");
		}else{
			console.log("********* NG!!");
		}
	}

	// コマンド初期化処理。(1回だけ)
	private async init_checkCommand(config: Object){
		/*
		for (var commandItem of PluginBase.commandList){
			//console.log( commandItem["name"] );
			if( commandItem["name"] === "admin-voicelog") {
				await this.monthCommand_update(commandItem);
				return true;
			}
		}*/

		var SlashItem : Discord.ApplicationCommand ;
		console.log("this.settingReturn_SlashCommands ===> ", PluginBase.commandList);
		for( var item of PluginBase.commandList ){
			if(item["name"] == 'admin-voicelog'){
				SlashItem = item;
				break;
			}
		}
		if ( SlashItem == null ) return false;
		await this.monthCommand_update(config,SlashItem);

		return true;

	}

	private async monthCommand_update(config:Object, commandItem: Discord.ApplicationCommand){
		//console.log("test RUN!");
		var Data : Discord.ApplicationCommandData = commandItem;
		//var OptionData : Discord.ApplicationCommandOptionData = {type:3, name:"", description:"", choices:[]};
		
		var oldlist : Object = await chart.most_oldMonth(config);
		this.oldMonthList = oldlist;
		for( var o_item of Data["options"]){
			if( o_item["name"] != "month" ) continue;

			o_item["choices"] = []

			for( var i = 0 ; i < oldlist["label"].length; i++ ){
				o_item["choices"].push({ "name" : oldlist["label"][i] , "value": String(i) });
			}
		}
		await commandItem.edit(Data);

	}


	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		if (!interaction.isCommand()) return;

		if( interaction.commandName === "init-command-voicelog" ){
			if(!await channelSend.Command_permison_check(client, interaction, config)) return;

			await interaction.reply('[LOG] NowLoading');
			if( await this.init_checkCommand(config)) await interaction.editReply("[SUCCESS]init Command!");
			else await interaction.editReply("[ERROR] init Command!");
		}
		else if (interaction.commandName === 'admin-voicelog') {		
			if(!await channelSend.Command_permison_check(client, interaction, config)) return;

			await interaction.reply('**【報告】**処理中です。ちょっと待っててね！');

			//console.log( interaction.options.data ) ;
			//console.log( interaction.options.get("month").value ) ;

			//console.log( this.oldMonthList["fileList"] );
			//console.log( interaction.options.get("format").value );

			// raw
			if(interaction.options.get("format").value === "raw"){
				//console.log("OK!  raw " , this.oldMonthList["fileList"] );
				var item = this.oldMonthList["fileList"].slice( Number(interaction.options.get("month").value) );
				//console.log("files => " , item);
				await interaction.editReply({ content: "**【報告】**rawデータ(yml)を出力したぜ！。" , files: item });
			}
			// csv
			else{
				var table : dfd.DataFrame;
				//for(var i = 0; i < Number(interaction.options.get("month").value) + 1; i++ ){
				var item_oldMonthList_fileList = this.oldMonthList["fileList"].slice( Number(interaction.options.get("month").value) );
				var item_oldMonthList_label = this.oldMonthList["label"].slice( Number(interaction.options.get("month").value) );
				//console.log(item_oldMonthList_label);

				table = await chart.table_MakeTimeList( this.fix_client ,  item_oldMonthList_fileList  ,  item_oldMonthList_label , this.config["Periodic_output_Role"] );
				//}
				if( table == null ){
					await interaction.editReply({ content: "**【ERROR】**データを加工してファイル出力できませんでした。" });
				}else{
					var csv_file = this.config["processed_output_TimeLine_folderpath"] + "anaylze.csv";
					await table.to_csv(csv_file);
					await interaction.editReply({ content: "**【報告】**加工済みデータ(CSV)を出力したぜ！" , files: [csv_file]});
				}
			}

		}
		else if (interaction.commandName === 'user-voicelog'){
			if(!await channelSend.Command_permison_check(client, interaction, config)) return;

			await interaction.reply("**【報告】**処理中です。ちょっと待っててね！");

			try{
				
				if( interaction.inGuild() == true ){
					var timeData = await chart.one_MakeTimeList( client,  config["output_TimeLine_filepath"] , [ interaction.member as Discord.GuildMember ]);
					//timeData = timeData.drop({ columns: ["name"], axis: 1, inplace: true });
					console.log("timeData" , timeData.values);
					var user_time = timeData.values[0][2];
					var round_user_time = Math.round(user_time * 100) / 100;

					if( user_time == null || user_time <= 0.0 ){
						await interaction.editReply( "**【報告】**どうやらボイスチャンネルに参加したことがないみたいです。" );
					}else if( round_user_time <= 0.0 ){					
						await interaction.editReply( "**【報告】**ボイスチャンネル参加時間時間短すぎ！\n  (" + String(user_time) + "時間)" );
					}else{
						await interaction.editReply("**【報告】**" + channelSend.text_check(interaction.user.username) + "#" + channelSend.text_check(interaction.user.discriminator) + "さんの参加時間は…**" + String(round_user_time) + "時間** です。" ); 
					}

				}else{
					await interaction.editReply("**【ERROR】**このコマンドは、使用できません。");
				}
			
			}catch(error){
				console.error(error);
			}
		}



	}


}