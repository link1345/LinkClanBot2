import * as Discord from 'discord.js';

import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

const { SlashCommandBuilder } = require('@discordjs/builders');


export class PluginBase {
	static classList: Object = {};
	static commandList: Array<Object> = [];
	classID : Number ;

	fix_client: Discord.Client; // できるだけ使わない方がいい。というか普通動かん。
	config: Object;
	base_doc: Object;
	rest: REST;

	// slashコマンド登録後のリターンログ
	settingReturn_SlashCommands:  Object;

	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST , className:string ){
		this.fix_client = fix_client;
		this.config = config;
		this.base_doc = base_doc;
		this.rest = rest;

		this.settingReturn_SlashCommands = [];
	
		this.init_SlashCommands(className);
	}

	async ready(fix_client: Discord.Client, config: Object){
		//console.log("ready PluginBase!");

		this.init_PermissionSlashCommands();
	}

	async exit(fix_client: Discord.Client, config: Object){
		//console.log("exit PluginBase!  => ", config);

		for(var item in this.settingReturn_SlashCommands){
			console.log( this.settingReturn_SlashCommands[item]["name"] , "コマンド 削除! , ID:" ,  this.settingReturn_SlashCommands[item]["id"] );

			// 削除！
			await fix_client.application.commands.delete( this.settingReturn_SlashCommands[item]["id"] , this.settingReturn_SlashCommands[item]["guild_id"] );
			// Guild ID の取得方法  ※ リストが帰ってくるYO
			//const guilddata = fix_client.guilds.cache.map(guild => guild.id);
			//console.log( guilddata );
		}
	}

	private async init_SlashCommands(className:string){
		
		// コマンドを重複登録しないように設定。
		if( className in PluginBase.classList ){
			PluginBase.classList[className] += 1;
		}else{
			PluginBase.classList[className] = 0;
		}
		this.classID = PluginBase.classList[className];
		//console.log(PluginBase.classList , className in PluginBase.classList );
		if ( !(this.config["slashCommand"] != null && this.classID == 0) ){
			return ;
		}

		try {
			//console.log('Started refreshing application (/) commands.');
			//console.log( "   Set Command => " , this.config["slashCommand"] );
			
			this.settingReturn_SlashCommands = await this.rest.put(
				Routes.applicationGuildCommands(this.base_doc["CLIENT_ID"], this.base_doc["GUILD_ID"]),
				{ body: this.config["slashCommand"] },
			);	

			PluginBase.commandList = PluginBase.commandList.concat( this.settingReturn_SlashCommands );

			//console.log("return => " , this.settingReturn_SlashCommands);
			
			//console.log('Successfully reloaded application (/) commands.');
		} catch (error) {
			console.error(error);
		}

	}

	private async init_PermissionSlashCommands(){
		
		if ( this.classID != 0 ){
			return ;
		}

		this.fix_client.guilds.fetch();
		var guild_list = this.fix_client.guilds.cache.map(guild => guild);
		for( var guild_item in guild_list ){
					
			for( var t_permission in this.config["slashCommand_permissions"] ) {
				for( var setting in this.settingReturn_SlashCommands ){
					
					
					//console.log(this.settingReturn_SlashCommands[setting]);

					if( this.config["slashCommand_permissions"][t_permission]['name'] == this.settingReturn_SlashCommands[setting]['name'] ){
						var obj : Array<Discord.ApplicationCommandPermissionData> = [];
						for( var item of this.config["slashCommand_permissions"][t_permission]['option'] ) {
							//console.log(item);
							obj.push( item );
						}
			
						if ( obj != [] ){
							const per = {
								"command" : this.settingReturn_SlashCommands[setting]['id'] , 
								"permissions" : obj

							}
							//console.log(per);
							var re = await guild_list[guild_item].commands.permissions.add(per);
							//console.log(re);
						}
					}
				}
			}

			

		}

	}

}