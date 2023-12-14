//import { copyFileSync } from "fs";
//import { eventNames } from "process";

import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

import * as Discord from 'discord.js';
import {Client, Intents} from 'discord.js';

import * as yaml from 'js-yaml';
import * as fs from 'fs';

import {EventList} from './event';

import type {PluginBase} from './plugin_base';

type moduleConstructor = (fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST) => PluginBase;

// プラグイン内でイベントを受け取る1つ分のモジュールファイルです
// そのモジュールを構築するコンストラクタ関数も同時に保持されています。
type PluginModule = {
	func: moduleConstructor,
	obj: PluginBase,
};

// PluginはPluginModuleいくつかで構成される1つの設定から構築されたプラグインプログラムです。
// configに従って各種 `app/plugin/...` ディレクトリから読み込まれ
// AppManagerによって管理されます。
type Plugin = {
	config_path: string,
	config: Object,
	object: Map<string, PluginModule>,
};

export class AppManager {
	client: Client;

	rest: REST;
	base_doc: Object;
	slashCommands: Array<Object>;

	plugins: Array<Plugin>;

	constructor() {

		this.base_doc = yaml.load(fs.readFileSync('./config/base.yml', 'utf8'));

		//this.slashCommands = [];
		
		this.rest = new REST({ version: '9' }).setToken(this.base_doc["TOKEN"]);

		this.client = new  Client({ intents: [ 
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_PRESENCES,  
			Intents.FLAGS.GUILD_MEMBERS, 
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_VOICE_STATES,
		] });

		this.plugins = [];
	}

	async Oneload(path: string){
		const files = await fs.promises.readdir(path);

		files.forEach(file => {
			const configPath = `${path}/${file}`;
			const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

			// モジュール作業
			if ( !("module" in config) ) return;
			if ( !("plugin_folder" in config) ) return;

			let object: Map<string, PluginModule> = new Map();
			for( var item of config.module ) {
				let mod = {};
				const pluginFolder = config.plugin_folder;
				const path = `${__dirname}/../plugin/${pluginFolder}/${item}`;

				const func = require(path)["main"];
				const obj = new func(this.client, config, this.base_doc, this.rest);

				object[path] = { func, obj };
			}

			if( object.size !== 0 ){
				this.plugins.push({
					config_path: configPath,
					config: config,
					object: object,
				});
			}
		});
	}

	async load(){
		var path = __dirname + "/../../config/plugin";
		await this.Oneload(path);
	}


	run_func = async<T extends readonly any[]>( eventName:string, module: Object[], client: Client, data:[...T] ) => {
		
		// コマンド初期化
		if(eventName === "ready"){
			await this.rest.put(
				Routes.applicationGuildCommands(this.base_doc["CLIENT_ID"], this.base_doc["GUILD_ID"]),
				{ body: [] },
			);
		}
		
		for(let item of module){
			for( let obj_key of Object.keys( item["object"] ) ){

				//console.log( "Event:" ,  eventName , ", Name:" , obj_key);
				if( item["object"][obj_key]["obj"][eventName] == null ) continue;
				try {
					//console.log("start!  obj_key " , obj_key , "   eventName " , eventName, "   : " , item["object"][obj_key]["obj"][eventName] );
					( await item["object"][obj_key]["obj"][eventName](client, item["config"], ...data) );				
					//console.log("end!  obj_key " , obj_key , "   eventName " , eventName);
				
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

	run(){
		// Eventの定義
		// refer: https://discord.js.org/#/docs/main/stable/class/Client

		const eventRun = async<T extends readonly any[]>( eventName:string, data:[...T]) => {
			const _e = async<T extends readonly any[]> (...data:[...T]) => {
				await this.run_func( eventName, this.plugins , this.client , data);
			}
			this.client.on(eventName, _e );
		}
		
		//console.log( EventList ) ;
		
		for( let obj_key of Object.keys( EventList ) ){
			var eventitem = [];
			for( let item in EventList[obj_key] ){
				if( item == "Date" ){
					eventitem.push( Date );
	
				}else if( item == "string" ){
					eventitem.push( NaN );
	
				}else if( item == "any" ){
					eventitem.push( NaN );
	
				}else{
					eventitem.push( require('discord.js')[EventList[obj_key][item]] );
					//console.log( EventList[obj_key] );
				}	
			}
			//console.log(obj_key , " => " , eventitem );
			eventRun(obj_key ,  eventitem );
		}
		
		this.client.login( this.base_doc["TOKEN"] );
	}

	async exit(){
		// 各プラグインで、終了処理を行うように指令を出す。
		await this.run_func( "exit", this.plugins , this.client , []); 
		// Botログアウト
		this.client.destroy();
		
		console.log(" ---------- ボット終了するぜー！ ----------");
		process.exit(0);
	}
}
