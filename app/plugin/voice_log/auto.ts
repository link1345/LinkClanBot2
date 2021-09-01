import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as cron from 'node-cron';
import * as yaml from 'js-yaml';
import internal = require('stream');

import * as fs from 'fs';


export class main  {
	constructor(){
		
		cron.schedule('0 0 0 1 * *', () => console.log('毎月定期実行の月初めだよ！'));
		cron.schedule('0 0 * * * *', () => console.log('test minute0 -----------'));
		cron.schedule('0 * * * * *', () => console.log('test second0 '));

	}

	//async ready(client_init: Discord.Client, config: Object, client: Discord.Client){
	//	console.log(config);
	//	console.log("run auto!");
	//}

	async voiceStateUpdate(client_init: Discord.Client, config: Object, oldState:Discord.VoiceState, newState:Discord.VoiceState){

		const Output_yml = async( text:Object ) => {
			var d = new Date();
			var year  = d.getFullYear();
			var month = ("0"+ Number(d.getMonth() + 1) ).slice(-2);
			var day   = ("0"+d.getDate() ).slice(-2);
			var hour  = ("0"+d.getHours() ).slice(-2);
			var min   = ("0"+d.getMinutes() ).slice(-2);
			var sec   = ("0"+d.getSeconds() ).slice(-2);
			
			text["time"] =  year + '/' + month + '/' + day + ' ' + hour + ':' + min + ':' + sec ;
			text["timestanp"] = Date.now();

			//console.log(  yaml.dump([text]) ) ;
			
			fs.appendFile(config["output_TimeLine_filepath"], yaml.dump([text]), (err) => {
			  if (err) throw err;			  
				if (  text["flag"] == "entry" ){
					console.log("【自動：" , text["time"] , "】" , text["member.name"], "さんが、" , text["after.channel.name"], "に入室しました。" );
				}else if (  text["flag"] == "exit" ){
					console.log("【自動：" , text["time"] , "】" , text["member.name"], "さんが、" , text["before.channel.name"], "から退室しました。" );
				}else if (  text["flag"] == "move" ){
					console.log("【自動：" , text["time"] , "】" , text["member.name"], "さんが、" , text["after.channel.name"], "から" , text["before.channel.name"], "へ移動しました。" );
				}
			});
			

		}
		
		///console.log("voiceStateUpdate! old   => " , oldState)
		//console.log("voiceStateUpdate! new  => " , newState)

		var output_data : Object = {};

		// vc入室
		if(oldState.channelId == null && newState.channelId != null ){
			output_data["flag"] = "entry";
			output_data["before.channel.name"] = "null";
			output_data["before.channel.id"] = "null";
			output_data["after.channel.name"] = newState.channel.name;
			output_data["after.channel.id"] = newState.channelId;
			output_data["member.displayName"] = newState.member.displayName;
			output_data["member.name"] = newState.member.user.username;
			output_data["member.discriminator"] = newState.member.user.discriminator;
			output_data["member.id"] = newState.member.id;
			Output_yml(output_data);
		}
		// vc退室
		if( oldState.channelId != null && newState.channelId == null ){
			output_data["flag"] = "exit";
			output_data["before.channel.name"] = oldState.channel.name;
			output_data["before.channel.id"] = oldState.channelId;
			output_data["after.channel.name"] = "null";
			output_data["after.channel.id"] = "null";
			output_data["member.displayName"] = newState.member.displayName;
			output_data["member.name"] = oldState.member.user.username;
			output_data["member.discriminator"] = oldState.member.user.discriminator;
			output_data["member.id"] = oldState.member.id;
			Output_yml(output_data);
		}
		// vc変更の場合
		else if(oldState.channelId != null && newState.channelId != null && oldState.channelId != newState.channelId){
			output_data["flag"] = "move";
			output_data["before.channel.name"] = oldState.channel.name;
			output_data["before.channel.id"] = oldState.channelId;
			output_data["after.channel.name"] = newState.channel.name;
			output_data["after.channel.id"] = newState.channelId;
			output_data["member.displayName"] = newState.member.displayName;
			output_data["member.name"] = newState.member.user.username;
			output_data["member.discriminator"] = newState.member.user.discriminator;
			output_data["member.id"] = newState.member.id;
			Output_yml(output_data);
		}
	}
}