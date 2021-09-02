import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';

import {PluginBase} from '../../util/plugin_base';

export class main extends PluginBase  {
	
	constructor(fix_client: Discord.Client, config: Object, base_doc:Object, rest:REST){
		super(fix_client, config, base_doc, rest, path.basename(path.dirname(__filename)) );
		
	}

	async ready(client_init, config){
		super.ready(client_init, config);
		console.log("run memberSheet interactive!");
	}

}