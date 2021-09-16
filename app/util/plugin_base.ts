import * as Discord from 'discord.js';

import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
<<<<<<< HEAD
=======
import { send } from 'process';
>>>>>>> ver1.0

const { SlashCommandBuilder } = require('@discordjs/builders');


export class PluginBase {
	static classList: Object = {};
<<<<<<< HEAD
	static commandList: Array<Object> = [];
=======
	static commandList: Array<Discord.ApplicationCommand> = [];
>>>>>>> ver1.0
	classID : Number ;

	fix_client: Discord.Client; // できるだけ使わない方がいい。というか普通動かん。
	config: Object;
	base_doc: Object;
	rest: REST;

	// slashコマンド登録後のリターンログ
<<<<<<< HEAD
	settingReturn_SlashCommands:  Object;
=======
	private settingReturn_SlashCommands:  Array<Discord.ApplicationCommand>;

	name : string;
>>>>>>> ver1.0

	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST , className:string ){
		this.fix_client = fix_client;
		this.config = config;
		this.base_doc = base_doc;
		this.rest = rest;

		this.settingReturn_SlashCommands = [];
	
<<<<<<< HEAD
		this.init_SlashCommands(className);
=======
		//await this.init_SlashCommands(className);
		this.name = className;
>>>>>>> ver1.0
	}

	async ready(fix_client: Discord.Client, config: Object){
		//console.log("ready PluginBase!");
<<<<<<< HEAD

		this.init_PermissionSlashCommands();
=======
		//console.log(this.name);
		await this.init_SlashCommands(this.name);
		await this.init_PermissionSlashCommands();

		//console.log("START EVENT  == " , this.name );
		//await new Promise(resolve => setTimeout(resolve, 3 * 1000));
		//console.log("END EVENT  == " , this.name );

		return ;
>>>>>>> ver1.0
	}

	async exit(fix_client: Discord.Client, config: Object){
		//console.log("exit PluginBase!  => ", config);

<<<<<<< HEAD
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
=======
		for(var item of this.settingReturn_SlashCommands){
			console.log( item["name"] , "コマンド 削除! , ID:" ,  item["id"] );
			var sendData : Discord.ApplicationCommandResolvable = item;
			// 削除！
			var rData = await fix_client.application.commands.delete( item["id"] , this.base_doc["GUILD_ID"] );
			// Guild ID の取得方法  ※ リストが帰ってくるYO
			//console.log( rData );
		}
	}

	private async init_SlashCommands(className:string): Promise<void>{
>>>>>>> ver1.0
		
		// コマンドを重複登録しないように設定。
		if( className in PluginBase.classList ){
			PluginBase.classList[className] += 1;
		}else{
			PluginBase.classList[className] = 0;
		}
		this.classID = PluginBase.classList[className];
<<<<<<< HEAD
		//console.log(PluginBase.classList , className in PluginBase.classList );
=======
		console.log(PluginBase.classList , className in PluginBase.classList );
>>>>>>> ver1.0
		if ( !(this.config["slashCommand"] != null && this.classID == 0) ){
			return ;
		}

<<<<<<< HEAD
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
=======
		//console.log('Started refreshing application (/) commands.');
		//console.log( "   Set Command => " , this.config["slashCommand"] );
		
		for( var command_item of this.config["slashCommand"] ){

			//console.log(command_item);

			var sendItem : Discord.ApplicationCommandData = command_item;

			//await new Promise(resolve => setTimeout(resolve, 3 * 1000));
			var rItem =  await this.fix_client.application.commands.create( sendItem, this.base_doc["GUILD_ID"] );
			this.settingReturn_SlashCommands = this.settingReturn_SlashCommands.concat( rItem );
		}
		PluginBase.commandList = PluginBase.commandList.concat( this.settingReturn_SlashCommands );

		console.log("return => " , this.settingReturn_SlashCommands);
		//console.log('Successfully reloaded application (/) commands.');
		
			
		return ;

	}

	private async init_PermissionSlashCommands(): Promise<void>{
		if ( this.classID != 0 ){
			return ;
		}		
		//console.log( "PluginBase.commandList ===> ",  PluginBase.commandList );

		await this.fix_client.guilds.fetch();
>>>>>>> ver1.0
		var guild_list = this.fix_client.guilds.cache.map(guild => guild);
		for( var guild_item in guild_list ){
					
			for( var t_permission in this.config["slashCommand_permissions"] ) {
				for( var setting in this.settingReturn_SlashCommands ){
<<<<<<< HEAD
					
					
					//console.log(this.settingReturn_SlashCommands[setting]);
=======
				
					//console.log("this.settingReturn_SlashCommands[setting] ===> " , this.settingReturn_SlashCommands[setting]);
>>>>>>> ver1.0

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
<<<<<<< HEAD
							//console.log(per);
=======
							//console.log("setting_PermissionData ===> ", per);
>>>>>>> ver1.0
							var re = await guild_list[guild_item].commands.permissions.add(per);
							//console.log(re);
						}
					}
				}
			}

			

		}

<<<<<<< HEAD
=======
		return ;
>>>>>>> ver1.0
	}

}