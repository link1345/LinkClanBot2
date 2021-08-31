import { copyFileSync } from "fs";


const EventEmitter = require('events').EventEmitter;

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { Client, Intents } = require('discord.js');

const yaml = require('js-yaml');
const fs   = require('fs');

export class AppManager {
	client: typeof Client;

	rest: typeof REST;

	base_doc: Object;
	slashCommands: Array<Object>;

	moduleList: Array<Object>;

	constructor(targetDirectory) {

		this.base_doc = yaml.load(fs.readFileSync('./config/base.yml', 'utf8'));

		this.slashCommands = [];
		
		this.rest = new REST({ version: '9' }).setToken(this.base_doc["TOKEN"]);

		this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });

		this.moduleList = [];
	}

	async Oneload(path: String){

		const files = await fs.promises.readdir(path);
		 

		var pluginData = {};
		//console.log(files)

		files.forEach(file => {
			var pluginItemData = {};
			pluginItemData["config_path"] = path + "/" + file;
			pluginItemData["config"] = yaml.load(fs.readFileSync( pluginItemData["config_path"] , 'utf8'));
			pluginItemData["object"] = {};
			
			// モジュール作業
			if ( "module" in pluginItemData["config"] && "plugin_folder" in pluginItemData["config"] ) {
				// hit!
				pluginItemData["config"]["module"].forEach(function(item, index, array) {
					var func_text : string = __dirname + "/../plugin/" + pluginItemData["config"]["plugin_folder"] + "/" + item ;
					//console.log("func path: " , func_text)
					pluginItemData["object"][func_text] = {}
					pluginItemData["object"][func_text]["func"] = require(func_text)["main"];
					//console.log("func: " , pluginItemData["object"][func_text] );
					pluginItemData["object"][func_text]["obj"] =  new pluginItemData["object"][func_text]["func"]() ;
				});
			}

			if( Object.keys(pluginItemData["object"]).length != 0 ){
				this.moduleList.push( pluginItemData );
			}

			// ついでに、slashCommandも観ておく
			if ( "slashCommand" in pluginItemData["config"] ){
				this.slashCommands = this.slashCommands.concat( pluginItemData["config"]["slashCommand"] );
			}
		});
		
		//console.log(this.moduleList)
		console.log("check! " , this.slashCommands);
	}

	async load(){
		var path = __dirname + "/../../config/plugin";
		await this.Oneload(path);
		//console.log( "load : ", this.moduleList );
	}


	async init_SlashCommands(){
		try {
			console.log('Started refreshing application (/) commands.');
			
			await this.rest.put(
				Routes.applicationGuildCommands(this.base_doc["CLIENT_ID"], this.base_doc["GUILD_ID"]),
				{ body: this.slashCommands },
			);
			
			console.log('Successfully reloaded application (/) commands.');
		} catch (error) {
			console.error(error);
		}
	}

	async run(){

		const run_func = async<T extends readonly any[]>( eventName:string,module: Object[], client, data:[...T] ) => {
			for(let item of module){
				
				for( let obj_key of Object.keys( item["object"] ) ){
					try {
						await item["object"][obj_key]["obj"][eventName](client, item, data);
					}catch(error) {
						if (error instanceof TypeError){
							// 関数がない場合の処理
							//console.log( "TypeError  Event:" ,  eventName , ", Name:" , obj_key);
						}else{				
							console.log(error);
						}
					}
				}
			}
		}
		
		this.client.on('ready', async client => {
			console.log(`Logged in as ${this.client.user.tag}!`);
			//console.log( this.moduleList )
			await run_func( "ready", this.moduleList , this.client , client);
		});
		
		this.client.on('interactionCreate', async interaction => {
			//console.log("id : " , interaction.commandId )

			await run_func( "interactionCreate", this.moduleList , this.client , interaction);

		});		

		this.client.login( this.base_doc["TOKEN"] );
	}
}