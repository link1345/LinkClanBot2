import {REST} from '@discordjs/rest';
import { channel } from 'diagnostics_channel';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

export async function ChannelList(client: Discord.Client, channelID: Array<String>) : Promise<Array<Discord.TextChannel>>{
	
	var channel_list : Array<Discord.TextChannel> = [];

	for(var item of channelID){
		channel_list.push( client.channels.cache.get( item.toString() ) as Discord.TextChannel );
	}
   	return channel_list;
<<<<<<< HEAD
=======
}

export function text_check(text: string): string{
	text = text.replace("/_/g",'\_');
	text = text.replace("/*/g","\*");
	text = text.replace("/~/g","\~");
	text = text.replace("/|/g","\|");
	text = text.replace("/`/g","\`");
	text = text.replace("/>/g","\>");
	return text;
>>>>>>> ver1.0
}