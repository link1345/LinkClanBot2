import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';
import * as cron from 'node-cron';

import {PluginBase} from '../../util/plugin_base';
import * as chart from './chart';

export class main extends PluginBase {

	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );

		cron.schedule('0 0 0 * * *', () => console.log('test minute0 -----------'));
		
		cron.schedule('*/20 * * * * *', () => this.test(this.config).then() );
	}


	async ready(client: Discord.Client, config: Object){
	}

	private async test(config: Object){

		console.log("test RUN!");

		/*
		this.fix_client.application.commands.fetch();
		var oldlist : Object = await chart.most_oldMonth(config);
		console.log(oldlist);
		*/
		
		this.fix_client.guilds.fetch();
		
		for( var [guild_key, guild_value] of this.fix_client.guilds.cache ){
			guild_value.commands.fetch();
			console.log(guild_value.name);
			//console.log( guild_value.commands.cache );
			for( var [key , value] of guild_value.commands.cache ){
				
				if(value["name"] != "admin-voicelog") continue;

				// 当たりなら...
				var oldlist : Object = await chart.most_oldMonth(config);
				console.log(oldlist);

				for( var o_item of value["options"]){
					if( o_item["name"] != "month" ) continue;

					o_item["choices"] = []

					for( var i = 0 ; i < oldlist["label"].length; i++ ){
						o_item["choices"].push({ "name" : oldlist["label"][i] , "value": oldlist["label"][i] });
					}
				}
				console.log("value[options]   ....   " , value["options"])

				//guild_value.edit();

			}
		}

		//console.log("command_item => " , command_item);
		//for( var c_item of command_item ){
		//	console.log(c_item);
		//}
		/*
		var setData : Discord.ApplicationCommandData = null ;
		for(var i = 0; i < oldlist["label"].length; i++){
			
		}
		
		this.fix_client.application.commands.edit(id, setData, guild_id);
		oldlist["label"]
		*/
		//this.fix_client.application.commands.edit();
	}


	async interactionCreate(client: Discord.Client, config: Object, interaction: Discord.Interaction){
		if (!interaction.isCommand()) return;

		if (interaction.commandName === 'admin-voicelog') {
			//interaction.commandId;
			await interaction.reply('Pong!  ' + interaction.id);
		}



	}


}