import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import * as Discord from 'discord.js';

import * as path from 'path';

import * as fs from 'fs';
import * as yaml from 'js-yaml';

import {PluginBase} from '../../util/plugin_base';

import * as channelSend from '../../util/channel_send';

export async function init_VoteCommand_subject_vote(config: Object){

	async function chage(name: string, config: Object){
		var SlashItem : Discord.ApplicationCommand ;
		//console.log("this.settingReturn_SlashCommands ===> ", PluginBase.commandList);
		for( var item of PluginBase.commandList ){
			if(item["name"] == name){
				SlashItem = item;
				break;
			}
		}
		if ( SlashItem == null ) return false;
		//console.log("test RUN!");
		var Data : Discord.ApplicationCommandData = SlashItem;
		//var OptionData : Discord.ApplicationCommandOptionData = {type:3, name:"", description:"", choices:[]};
		var vote_fileData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));

		for( var o_item of Data["options"]){
			if( o_item["name"] != "subject_vote" ) continue;

			o_item["choices"] = []

			if(vote_fileData != null) {
				for( var i = 0 ; i < vote_fileData.length; i++ ){
					o_item["choices"].push({ "name" : vote_fileData[i]["Title"] , "value": vote_fileData[i]["VoteBoxID"] });
				}
			}
		}
		await SlashItem.edit(Data);

	}
	
	chage("vote_info", config);
	chage("vote_close", config);
	chage("vote_edit", config);

	return true;
}

async function f_message(client: Discord.Client, value_subject_vote ) : Promise<Discord.Message> {
	await client.channels.fetch(value_subject_vote["channelID"]);
	var channleData = client.channels.cache.get(value_subject_vote["channelID"]);
	var message_m : Discord.Message;
	if(channleData.isText()){
		var channel_text : Discord.TextChannel = channleData as Discord.TextChannel;
		await channel_text.messages.fetch();
		message_m = channel_text.messages.cache.get(value_subject_vote["MessageID"]);
	}
	message_m.fetch();
	return message_m;
}

export async function setVote(client: Discord.Client, config: Object, interaction: Discord.CommandInteraction) : Promise <void> {
	// このユーザーが既に何回投票欄を設定しているか？

	// 投票欄を作成
	
	/* // ver. Button 
	var row = new Discord.MessageActionRow();
	for(var num = 1; num <= 4; num++){
		const text_id = 'item' + num;
		const text_color : Discord.MessageButtonStyleResolvable = Number(interaction.options.get( text_id + '-color' ).value);
		const text_label = String(interaction.options.get( text_id ).value);
		row.addComponents(
			new Discord.MessageButton()
				.setCustomId(text_id)
				.setLabel( text_label )
				.setStyle( text_color ),
		);
	}*/

	//try{

	await interaction.reply({content: "**【作業中】**少々お待ちください。" + channelSend.text_check("_(:3」∠)_") , ephemeral: false});

	var row = new Discord.MessageActionRow();
	const text_id = interaction.user.id + "_VoteBox_" + 0;
	var item : Array<Discord.MessageSelectOptionData> = [];

	var labels = [];
	for(var num = 1; num <= 5; num++){
		const text_item_id = "item" + num;
		var text_label = interaction.options.get( text_item_id );
		if (text_label == null || text_label.value == null || String(text_label.value) === ""){
			break;
		}
		var text_description = interaction.options.get( text_item_id + "-description" );
		if (text_description == null || text_description.value == null){
			item.push({
				label: String(text_label.value),
				value: text_item_id,
			});
		}else{
			item.push({
				label: String(text_label.value),
				description: String(text_description.value),
				value: text_item_id,
			});
		}
		//labels.push({"label":text_label.value });
		labels.push( text_label.value );
		
	}
	console.log(labels);

	var choice_count = Number(interaction.options.get( 'choice_count' ).value);
	if(choice_count <= 0){
		await interaction.editReply({content:"【警告】選択できる個数が少なすぎるようです" });
		return null;
	}else if(choice_count > labels.length){
		await interaction.editReply({content:"【警告】選択できる個数が多すぎるようです" });
		return null;
	}

	row.addComponents(
		new Discord.MessageSelectMenu()
			.setCustomId( text_id )
			.setPlaceholder('Nothing selected')
			.addOptions( item )
			.setMinValues(1)
			.setMaxValues(choice_count)
	);


	var title = String(interaction.options.get( 'message' ).value);
	var open_information = String(interaction.options.get( 'open_information' ).value);
	var limit_time = Number(interaction.options.get( 'limit_time' ).value);

	
	var send_embed : Discord.MessageEmbed = new Discord.MessageEmbed();
	send_embed.setTitle("Title : " + title);

	var setTime = new Date();
	setTime.setDate( setTime.getDate() + limit_time );
	send_embed.setTimestamp(setTime);
	send_embed.setFooter("投票締め切り日 … ");
	
	if( open_information === "none" ){
	}else if( open_information === "count" ){
		send_embed.addField("Count", "まだ誰も投票してません (´・ω・｀)" );
	}else if( open_information === "all" ){
		//send_embed.addField('\u200B', '\u200B');
		var cound_userlist = [];
		for(var label_item of labels){
			//send_embed.addField(label_item, "[未投票]" );
			var embed_item : Discord.EmbedFieldData = {"name": label_item, "value": "[未投票]"};
			cound_userlist.push(embed_item);
		}
		send_embed.addFields(cound_userlist);
	}

	var send_obj : Discord.InteractionReplyOptions = {
		content : '**≪ -- 投票ボックス -- ≫**',
		components: [row],
		embeds: [send_embed]
	}

	var label_data = [];
	for(var label_item of labels){
		label_data.push({ "label": label_item, "member": []});
	}	

	await interaction.editReply(send_obj);
	var replayReturn : Discord.Message = await interaction.fetchReply() as Discord.Message;
	console.log("message === " , replayReturn);

	var VoteBoxData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));
	if(VoteBoxData == null){
		VoteBoxData = [];
	}
	VoteBoxData.push({
		"makeUserID": interaction.user.id,
		"VoteBoxID": text_id,
		"labels": labels,
		"limit": String(setTime.valueOf()),
		"guildID": interaction.guildId,
		"channelID": replayReturn.channelId ,
		"MessageID": replayReturn.id,
		"Title": title,
		"data": label_data
	});

	// ymlで記録
	//await fs.promises.appendFile(config["vote_tmp_filepath"], yaml.dump([return_data])); 
	await fs.promises.writeFile(config["vote_tmp_filepath"], yaml.dump(VoteBoxData));

	// editやclose、infoのsubject_vote欄を編集する。
	await init_VoteCommand_subject_vote(config);

	//} catch(error){
	//	console.log(error);
	//}

}


export async function editVote(client: Discord.Client, config: Object, interaction: Discord.CommandInteraction) : Promise <void> {
	try{
	
	var vote_fileData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));

	var subject_vote = interaction.options.get( 'subject_vote' );
	if (subject_vote == null || subject_vote.value == null || String(subject_vote.value) === ""){
		return;
	}

	// 選択肢Boxの情報取得
	var value_subject_vote = vote_fileData.find(element => element["VoteBoxID"] != null && element["VoteBoxID"] === String(subject_vote.value) );
	var value_subject_vote_index = vote_fileData.find(element => element["VoteBoxID"] != null && element["VoteBoxID"] === String(subject_vote.value) );

	async function setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index){
		vote_fileData[value_subject_vote_index] = value_subject_vote;
		await fs.promises.writeFile(config["vote_tmp_filepath"], yaml.dump(vote_fileData));
		return;
	}


	//console.log("value_subject_vote  =>>> " , value_subject_vote);
	if(value_subject_vote == null) return;

	// 編集情報の確認
	var edit_mode = interaction.options.get( 'mode' );
	var edit_value = interaction.options.get( 'value' );

	var message_m = await f_message(client, value_subject_vote);
	if(message_m == null){
		await interaction.reply({content: "編集するべきメッセージが見つかりませんでした", ephemeral: true});
		return;
	}
	//console.log("message_m  =>>> " , message_m);

	function Cast_MessageEditOptions(message_m: Discord.Message) : Discord.MessageEditOptions{
		var SendMessageData: Discord.MessageEditOptions = {
			content: message_m.content,
			embeds: message_m.embeds,
			components: message_m.components,
		};
		return SendMessageData;
	}

	if( edit_mode.value === "title" ){	
		if(message_m.embeds.length !== 0){
			var embed_data = message_m.embeds[0];
			embed_data.setTitle( "Title : " + (edit_value.value as string) );
			await message_m.edit( Cast_MessageEditOptions(message_m) );

			await interaction.reply({content: "タイトルを編集しました", ephemeral: true});
		}

	}else if( edit_mode.value === "label_add" ){

		value_subject_vote["labels"].push(edit_value.value as string);
		value_subject_vote["data"].push({ "label":edit_value.value as string , "member": [] });
		
		if(message_m.embeds.length !== 0){
			var embed_data = message_m.embeds[0];
			embed_data.addField( edit_value.value as string , "[未投票]" );
		}

		if(message_m.components.length !== null){
			var component_data = message_m.components[0];
			var select = component_data.components[0] as Discord.MessageSelectMenu;

			if(select.options.length >= 24) {
				await interaction.reply({content: "既にある項目が多いため、追加できませんでした。", ephemeral: true});
				return ;	
			}

			function getID(select: Discord.MessageSelectMenu): string{
				var seleclt_itemID = "";
				var i = 1;
				while(true){
					var tmp = "item" + String(i);
				 	if( select.options.findIndex( item => item.value === tmp ) == -1 ){
						seleclt_itemID = tmp;
						break;
					}
					i++;
				}
				return seleclt_itemID;
			}

			var seleclt_itemID = getID(select);
			console.log( seleclt_itemID );
			var item :Discord.MessageSelectOptionData = {label:String(edit_value.value) , value: seleclt_itemID };

			select.addOptions(item);
			
			component_data.components[0] = select;
			console.log( select );


			await message_m.edit( Cast_MessageEditOptions(message_m) );
			await setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index);
			await interaction.reply({content: "項目を追加しました", ephemeral: true});
		}

	}else if( edit_mode.value === "label_del" ){

		var del_index = value_subject_vote["labels"].findIndex(text => text === String(edit_value.value) );
		if(del_index == -1){
			await interaction.reply({content: "削除する項目がありませんでした", ephemeral: true});
			return;
		};

		value_subject_vote["labels"].splice(del_index, 1);
		value_subject_vote["data"].splice(del_index, 1);

		if(message_m.embeds.length !== 0){
			var field_data = message_m.embeds[0].fields;
			//embed_data.( edit_value.value as string , "[未投票]" );
			field_data.splice(del_index, 1);
			message_m.embeds[0].setFields(field_data);
		}

		if(message_m.components.length !== null){
			var component_data = message_m.components[0];
			var select = component_data.components[0] as Discord.MessageSelectMenu;
			//var seleclt_itemID = "item" + String(del_index+1);

			if(select.options.length <= 2) {
				await interaction.reply({content: "選択項目が少なすぎて削除できませんでした。", ephemeral: true});
				return ;	
			}

			select = select.spliceOptions(del_index, 1);
			component_data.components[0] = select;

			await message_m.edit( Cast_MessageEditOptions(message_m) );
			await setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index);
			await interaction.reply({content: "該当項目を削除しました", ephemeral: true});

		}



	}else if( edit_mode.value === "choice_count" ){

		if(message_m.components.length !== null && Number(edit_value.value) != NaN){
			var component_data = message_m.components[0];
			if(component_data.components[0] == null) return;

			var select = component_data.components[0] as Discord.MessageSelectMenu;
			select.setMaxValues( Number(edit_value.value) );
			await message_m.edit( Cast_MessageEditOptions(message_m) );
			await interaction.reply({content: "選択可能項目数を変更しました", ephemeral: true});
		}else{
			await interaction.reply({content: "選択可能項目数を変更できませんでした", ephemeral: true});
		}

	}else if( edit_mode.value === "limit_time" ){

		if( Number(edit_value.value) == NaN ){
			await interaction.reply({content: "制限時間を変更できませんでした。", ephemeral: true});
			return;
		}

		var add_limit = new Date();
		add_limit.setDate(  add_limit.getDate() - Number(edit_value.value) );
		
		value_subject_vote["limit"] = edit_value.value as string;

		if(message_m.embeds.length !== 0){
			var embed_data = message_m.embeds[0];
			embed_data.setTimestamp( add_limit );
		}

		await message_m.edit( Cast_MessageEditOptions(message_m) );
		await setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index);
		await interaction.reply({content: "制限時間を変更しました", ephemeral: true});
	}

	} catch(error){
		console.log(error);
	}

}


export async function getSelectMenu(client: Discord.Client, config: Object, interaction: Discord.SelectMenuInteraction) : Promise<Boolean> {
	try{
	var VoteBoxData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));
	if(VoteBoxData == null){
		interaction.reply({content:"【EEROR】問題が発生しました。Bot管理者にご相談ください。", ephemeral:true});
		return false;
	}

	var VoteItem = VoteBoxData.find(element => 
		element["MessageID"] != null && element["MessageID"] === String(interaction.message.id) &&
		element["channelID"] != null && element["channelID"] === String(interaction.channelId)
	);
	if(VoteItem == null){
		interaction.reply({content:"【EEROR】問題が発生しました。Bot管理者にご相談ください。", ephemeral:true});
		return false;
	}

	// ymlデータの更新
	for(var value of VoteItem["data"]){
		// 選択されている
		if( interaction.values.findIndex( text => text === value["label"] ) != -1 ){
			// メンバーリストに既に記載されていたら…
			if( value["member"].findIndex( id => id === String(interaction.user.id) ) != -1){
				// 何もしない	
			}else{
			// 記載されてなかったら...
				value["member"].push( String(interaction.user.id) );
			}
		}else{
		// 選択されてない
			// メンバーリストに既に記載されていたら…
			if( value["member"].findIndex( id => id === String(interaction.user.id) ) != -1){
				var find_id = value["member"].findIndex( id => id === String(interaction.user.id) );
				value["member"].splice(find_id,1);
			}else{
			// 記載されてなかったら...
				// 何もしない
			}
		}
	}

	// 表の更新
	var t_message = await f_message(client, VoteItem);
	var field = t_message.embeds[0].fields;
	for(var value of VoteItem["data"]){
		var field_data = field.find(item => item.name === value);
		if(field_data == null) continue;

		if(value["member"] == null || value["member"] == [] ){
			field_data.value = "[未投票]";
		}else{
			// 各項目の情報を編集
			var displayName_list = "";
			for(var userID of value["member"]){
				client.guilds.fetch();
				var guild = client.guilds.cache.get(VoteItem["guildID"]);
				guild.members.fetch();
				var member = guild.members.cache.get(userID);

			 	displayName_list += "\n" + channelSend.text_check( member.displayName );
			}
			field_data.value = displayName_list;
		}
	}
	t_message.embeds[0].fields = field;
	t_message.edit({
		content: t_message.content,
		embeds: t_message.embeds,
		components: t_message.components
	});
	}catch(error){
		console.log(error);
	}

	return true
}