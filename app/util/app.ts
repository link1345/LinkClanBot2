import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

import * as Discord from 'discord.js';
import {Client, Intents} from 'discord.js';

import * as yaml from 'js-yaml';
import * as fs from 'fs';

import {PluginModule, PluginEvents, PluginEventType, ClientEventType, ClientEventList} from './event';

// PluginはPluginModuleいくつかで構成される1つの設定から構築されたプラグインプログラムです。
// configに従って各種 `app/plugin/...` ディレクトリから読み込まれ
// AppManagerによって管理されます。
type Plugin = {
	config_path: string,
	config: Object,
	modules: PluginModule[],
};

export class AppManager {
	client: Client;
	rest: REST;
	baseConfig: Object;
	plugins: Array<Plugin>;

	constructor() {
		this.baseConfig = yaml.load(fs.readFileSync('./config/base.yml', 'utf8'));

		this.rest = new REST({ version: '9' }).setToken(this.baseConfig["TOKEN"]);

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

			let modules: PluginModule[] = [];
			for( const item of config.module ) {
				const pluginFolder = config.plugin_folder;
				const path = `${__dirname}/../plugin/${pluginFolder}/${item}`;

				const func = require(path)["main"];
				const obj = new func(this.client, config, this.baseConfig, this.rest);

				modules.push(obj);
			}

			if( modules.length !== 0 ){
				this.plugins.push({
					config_path: configPath,
					config: config,
					modules: modules,
				});
			}
		});
	}

	async load(){
		var path = __dirname + "/../../config/plugin";
		await this.Oneload(path);
	}


	async run_func<K extends PluginEventType>(event: K, client: Client, ...args: PluginEvents[K]): Promise<void> {
		// コマンド初期化
		if(event === "ready"){
			await this.rest.put(
				Routes.applicationGuildCommands(this.baseConfig["CLIENT_ID"], this.baseConfig["GUILD_ID"]),
				{ body: [] },
			);
		}

		for(const plugin of this.plugins) {
			for( const mod of plugin.modules ){
				const config = plugin.config;
				const handler = mod[event];
				if( handler == null ) continue;

				try {
					await handler(client, config, ...args);
				} catch (error) {
					if (error instanceof TypeError){
						// 関数がない場合の処理
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
		const registerEvent = async<K extends ClientEventType>(event: K) => {
			const handler = async(...data: PluginEvents[K]) => {
				await this.run_func(event, this.client, ...data);
			}
			this.client.on(event, handler);
		}

		for( const event of ClientEventList ) {
			registerEvent(event);
		}

		this.client.login( this.baseConfig["TOKEN"] );
	}

	async exit(){
		// 各プラグインで、終了処理を行うように指令を出す。
		await this.run_func("exit", this.client);
		// Botログアウト
		this.client.destroy();

		console.log(" ---------- ボット終了するぜー！ ----------");
		process.exit(0);
	}
}
