import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

export async function ChannelList(client: Discord.Client, channelID: Array<String>) : Promise<Array<Discord.TextChannel>>{
	
	var channel_list : Array<Discord.TextChannel> = [];

	for(var item of channelID){
		channel_list.push( client.channels.cache.get( item.toString() ) as Discord.TextChannel );
	}
   	return channel_list;
}

export function text_check(text: string): string{
	text = text.replace(/_/g,'\\_');
	text = text.replace(/\*/g,"\\\*");
	text = text.replace(/~/g,"\\~");
	text = text.replace(/\|/g,"\\\|");
	text = text.replace(/`/g,"\\`");
	text = text.replace(/>/g,"\\>");
	console.log(text);
	return text;
}

export async function Command_permison_check(clinet :Discord.Client ,interaction: Discord.CommandInteraction, config: Object):　Promise<Boolean>{
	if ( config["slashCommand_channel_permisson"] == null ) {
		return true;
	}

	var chech_id = [];
	for( var item of config["slashCommand_channel_permisson"]){

		if(item == null || item["defaultPermission"] == true || item["option"] == null ){
			return true;
		}
		if(item["name"] !== interaction.commandName) continue;

		for( var item_permisson of item["option"] ){

			if ( String(item_permisson["id"]) === String(interaction.channelId) ){				
				//console.log( item_permisson["id"] , "   " , String(interaction.channelId)  )
				return true;
			}else{
				chech_id.push( item_permisson["id"] );
			}
		}
	}
	if(chech_id.length === 0) return true;

	await clinet.channels.fetch( chech_id[0] );

	var text : string = "【WARN】ここのチャンネルでは、このコマンドを実行できません。";
	var item_channel = clinet.channels.cache.get( chech_id[0] );
	if( item_channel.type === "GUILD_TEXT" ){
		var text_channel : Discord.TextChannel = item_channel as Discord.TextChannel;
		var permisson = text_channel.permissionsFor(interaction.member as Discord.GuildMember).toArray();
		if( permisson != null || permisson != []){	
			if( text_channel.parent == null ){
				text = text + "\nテキストチャンネル「" + text_channel.name + "」などでのコマンド実行をお願いします。(m´・ω・｀)m ";
			}else{
				text = text + "\nテキストチャンネル「[category:" + text_channel.parent.name + "]" + text_channel.name + "」などでのコマンド実行をお願いします。(m´・ω・｀)m ";
			}
		}else{
			//text = text + "\n なお、現在、貴方にコマンド実行できるチャンネルはありません。";
		}
	}else if( item_channel.type === "GUILD_PUBLIC_THREAD" ){
		var thread_channel : Discord.ThreadChannel = item_channel as Discord.ThreadChannel;
		var permisson = thread_channel.permissionsFor(interaction.member as Discord.GuildMember).toArray();
		if( permisson != null || permisson != []){	
			if( thread_channel.parent == null ){
				text = text + "\nスレッドチャンネル「" + thread_channel.name + "」などでのコマンド実行をお願いします。_(._.)_";
			}else{
				text = text + "\nスレッドチャンネル「[category:" + thread_channel.parent.name + "]" + thread_channel.name + "」などでのコマンド実行をお願いします。_(._.)_";
			}
		}else{
			//text = text + "\n なお、現在、貴方にコマンド実行できるチャンネルはありません。";
		}
	}

	console.warn( text );
	await interaction.reply({ content: text_check(text), ephemeral: true });
	return false;
	
}