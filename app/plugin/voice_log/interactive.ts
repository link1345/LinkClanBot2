import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';
import * as cron from 'node-cron';

import {PluginBase} from '../../util/plugin_base';
import * as chart from './chart';
import { copyFileSync } from 'fs';

import * as dfd from 'danfojs-node';

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
		
		//commandItem.edit();

		/*
		await this.fix_client.guilds.fetch();
		for( var [guild_key, guild_value] of this.fix_client.guilds.cache ){
			await guild_value.commands.fetch();
			//console.log(guild_value.name);
			//console.log( guild_value.commands.cache );
			for( var [key , value] of guild_value.commands.cache ){
				
				if(value["name"] != "admin-voicelog") continue;

				// 当たりなら...
				var oldlist : Object = await chart.most_oldMonth(config);

				this.oldMonthList = oldlist;

				//console.log(oldlist);

				for( var o_item of value["options"]){
					if( o_item["name"] != "month" ) continue;

					o_item["choices"] = []

					for( var i = 0 ; i < oldlist["label"].length; i++ ){
						o_item["choices"].push({ "name" : oldlist["label"][i] , "value": String(i) });
					}
				}
				//console.log("value[options]   ....   " , value["options"])
				
				for( var o_item of value["options"]){
					//console.log("value[options][choices]   ....   " , o_item["choices"])
				}
				var co_data : Discord.ApplicationCommandData = value;
				await value.edit( co_data )

				//console.log(value);
			}
			//guild_value.commands.set();
		}
		*/
	}


	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		if (!interaction.isCommand()) return;

		if( interaction.commandName === "init-command-voicelog" ){
			if( await this.init_checkCommand(config)) interaction.reply("init Command!");
			else interaction.reply("ERROR : init Command!");
		}
		else if (interaction.commandName === 'admin-voicelog') {
			//interaction.commandId;
			//await interaction.reply('Pong!  ' + interaction.id);

			//console.log( interaction.options.data ) ;
			console.log( interaction.options.get("month").value ) ;

			//console.log( this.oldMonthList["fileList"] );
			
			console.log( interaction.options.get("format").value );

			// raw
			if(interaction.options.get("format").value === "raw"){
				console.log("OK!  raw " , this.oldMonthList["fileList"] );

				var item = this.oldMonthList["fileList"].slice( Number(interaction.options.get("month").value) );
				console.log("files => " , item);
				await interaction.reply({ content: "**【報告】**rawデータ(yml)を出力したぜ！。" , files: item });
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
					await interaction.reply({ content: "**【ERROR】**データを加工してファイル出力できませんでした。" });
				}else{
					var csv_file = this.config["processed_output_TimeLine_folderpath"] + "anaylze.csv";
					await table.to_csv(csv_file);
					await interaction.reply({ content: "**【報告】**加工済みデータ(CSV)を出力したぜ！" , files: [csv_file]});
				}
			}

		}



	}


}