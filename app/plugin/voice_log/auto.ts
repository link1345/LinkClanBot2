import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';


const cron = require('node-cron');

export class main  {
	constructor(){
		
		cron.schedule('0 0 0 1 * *', () => console.log('毎月定期実行の月初めだよ！'));
		cron.schedule('0 0 * * * *', () => console.log('test minute0 -----------'));
		cron.schedule('0 * * * * *', () => console.log('test second0 '));

	}

	test(){

	}

	async ready(client_init: Discord.Client, config: Object, client: Discord.Client){
		console.log(config);
		console.log("run auto!");
	}
	
	async channelUpdate(client_init: Discord.Client, config: Object, oldChannel : any, newChannel: any){
		console.log("auto channelUpdate!");
	}

	async guildMemberUpdate(client_init: Discord.Client, config: Object, oldMember : any, newMember: any){
		console.log("auto guildMemberUpdate!");
	}

	async userUpdate(client_init: Discord.Client, config: Object, oldUser : Discord.User, newUser: Discord.User){
		console.log("auto userUpdate!");
	}


}