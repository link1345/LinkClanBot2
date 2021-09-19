import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

export function getType(Type:string, list: Array<Object>){
	var pointList = [];
	for( var num in list ){
		if( list[num]["type"] === Type ){
			pointList.push( num );
		}
	}
	return pointList;
}

export async function init_Set_SheetCommand(commandList: Array<Discord.ApplicationCommand>, config: Object, slashName: string){
	var SlashItem : Discord.ApplicationCommand ;
	//console.log("this.settingReturn_SlashCommands ===> ", commandList);
	for( var item of commandList ){
		if(item["name"] == slashName){
			SlashItem = item;
			break;
		}
	}
	//console.log("SlashItem ===> ", SlashItem);
	if ( SlashItem == null ) return;
	await Edit_SheetCommand(config["SheetIndex"], SlashItem);
}

async function Edit_SheetCommand( SheetIndexList: Array<Object>, setting_command: Discord.ApplicationCommand) {
	var typePointList = getType("text", SheetIndexList);	
	//console.log( typePointList );
	var Data : Discord.ApplicationCommandData = setting_command;
	//console.log( "Data .... ",  Data );
	//console.log( "SheetIndexList .... ",  SheetIndexList );
	Data["options"] = setting_command.options;
	try{
		for( var item of typePointList){
			//console.log(item);
			var OptionData : Discord.ApplicationCommandOptionData = {type:3, name:"", description:""};
			OptionData["name"] = SheetIndexList[item]["name"];
			OptionData["description"] = SheetIndexList[item]["description"];
			OptionData["type"] = 3;
			OptionData["required"] = false;
			Data["options"].push(OptionData);
		}
		//console.log( "Data[options] ===> ", Data["options"] );
	}catch(error){
		console.error(error);
	}
	
	if(Data["options"] == []) return;	
	await setting_command.edit(Data);

	return ;
}