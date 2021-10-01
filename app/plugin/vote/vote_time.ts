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
	await message_m.fetch();
	return message_m;
}

function Cast_MessageEditOptions(message_m: Discord.Message) : Discord.MessageEditOptions{
	var SendMessageData: Discord.MessageEditOptions = {
		content: message_m.content,
		embeds: message_m.embeds,
		components: message_m.components,
	};
	return SendMessageData;
}

export async function setVote(client: Discord.Client, config: Object, interaction: Discord.CommandInteraction) : Promise <void> {
	// このユーザーが既に何回投票欄を設定しているか？

	// 投票欄を作成
	//try{

	await interaction.reply({content: "**【作業中】**少々お待ちください。" + channelSend.text_check("_(:3」∠)_") , ephemeral: false});

	var row = new Discord.MessageActionRow();

	function id_cheak(config: Object, interaction: Discord.CommandInteraction) : string{
		var VoteBoxData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));

		if(VoteBoxData == null){
			return String(interaction.user.id) + "_VoteBox_" + String(0);
		}

		for(var i = 0; i < 5; i++){
			const text_id = String(interaction.user.id) + "_VoteBox_" + String(i);
			if( VoteBoxData.findIndex(obj => obj["VoteBoxID"] === text_id) == -1 ){
				return text_id;
			}
		}
		return "";
	}

	const text_id = id_cheak(config, interaction);
	if(text_id === ""){
		await interaction.editReply({content:"**【ERROR】**１人が投票欄を作成できる個数を超えています(max:5)" });
		return;
	}
	
	
	var item : Array<Discord.MessageSelectOptionData> = [];

	var labels = [];
	var item_value = [];
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
		item_value.push( text_item_id );
		
	}

	var choice_count = Number(interaction.options.get( 'choice_count' ).value);
	if(choice_count <= 0){
		await interaction.editReply({content:"**【警告】**選択できる個数が少なすぎるようです" });
		return null;
	}else if(choice_count > labels.length){
		await interaction.editReply({content:"**【警告】**選択できる個数が多すぎるようです" });
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
	//var limit_time = Number(interaction.options.get( 'limit_time' ).value);

	
	var send_embed : Discord.MessageEmbed = new Discord.MessageEmbed();
	send_embed.setTitle("Title : " + title);

	//var setTime = new Date();
	//setTime.setDate( setTime.getDate() + limit_time );
	//send_embed.setTimestamp(setTime);
	send_embed.setColor('#0099ff');
	//send_embed.setTimestamp(setTime);
	//send_embed.setFooter("投票締め切り日 … ");
	
	if( open_information === "none" ){
		send_embed.addField('\u200B', '\u200B');
	}else if( open_information === "count" ){
		send_embed.addField('\u200B', '\u200B');
		send_embed.addField("Count", channelSend.text_check("まだ誰も投票してません (´・ω・｀)") );
	}else if( open_information === "all" ){
		send_embed.addField('\u200B', '\u200B');
		var cound_userlist = [];
		for(var label_item of labels){
			//send_embed.addField(label_item, "_[ NotVoted ]_" );
			var embed_item : Discord.EmbedFieldData = {"name": label_item, "value": "_[ NotVoted ]_"};
			cound_userlist.push(embed_item);
		}
		send_embed.addFields(cound_userlist);
	}

	var send_obj : Discord.InteractionReplyOptions = {
		content : '**≪ -- Ballot box -- ≫**',
		components: [row],
		embeds: [send_embed]
	}

	var label_data = [];
	for(var i = 0;i < labels.length; i++){
		label_data.push({ "label": labels[i], "value": item_value[i], "member": [] });
	}	

	await interaction.editReply(send_obj);
	var replayReturn : Discord.Message = await interaction.fetchReply() as Discord.Message;

	var VoteBoxData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));
	if(VoteBoxData == null){
		VoteBoxData = [];
	}
	VoteBoxData.push({
		"makeUserID": interaction.user.id,
		"VoteBoxID": text_id,
		"labels": labels,
		//"limit": String(setTime.valueOf()),
		"guildID": interaction.guildId,
		"channelID": replayReturn.channelId ,
		"MessageID": replayReturn.id,
		"Title": title,
		"data": label_data,
		"mode":  open_information
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
	var value_subject_vote_index = vote_fileData.findIndex(element => element["VoteBoxID"] != null && element["VoteBoxID"] === String(subject_vote.value) );

	async function setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index){
		vote_fileData[value_subject_vote_index] = value_subject_vote;
		await fs.promises.writeFile(config["vote_tmp_filepath"], yaml.dump(vote_fileData));
		return;
	}

	//console.log("value_subject_vote  =>>> " , value_subject_vote);
	if(value_subject_vote == null) return;

	if( value_subject_vote["makeUserID"] !== interaction.user.id ){
		await interaction.reply({content: "**【ERROR】**あなたは、この投票箱を作成した人ではないため、処理できませんでした。", ephemeral: true});
		return;
	}


	// 編集情報の確認
	var edit_mode = interaction.options.get( 'mode' );
	var edit_value = interaction.options.get( 'value' );

	var message_m = await f_message(client, value_subject_vote);
	if(message_m == null){
		await interaction.reply({content: "**【ERROR】**編集するべきメッセージが見つかりませんでした", ephemeral: true});
		return;
	}
	//console.log("message_m  =>>> " , message_m);

	if( edit_mode.value === "title" ){	
		if(message_m.embeds.length !== 0){
			var embed_data = message_m.embeds[0];

			value_subject_vote["Title"] = (edit_value.value as string);
			embed_data.setTitle( "Title : " + (edit_value.value as string) );
			await message_m.edit( Cast_MessageEditOptions(message_m) );
			await setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index);
			await init_VoteCommand_subject_vote(config);

			await interaction.reply({content: "**【報告】**タイトルを編集しました", ephemeral: true});
		}

	}else if( edit_mode.value === "label_add" ){

		if(message_m.embeds.length !== 0 && value_subject_vote["mode"] === "all" ){
			var embed_data = message_m.embeds[0];
			embed_data.addField( edit_value.value as string , "_[ NotVoted ]_" );
		}

		if(message_m.components.length !== null){
			var component_data = message_m.components[0];
			var select = component_data.components[0] as Discord.MessageSelectMenu;

			if(select.options.length >= 24) {
				await interaction.reply({content: "**【ERROR】**既にある項目が多いため、追加できませんでした。", ephemeral: true});
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
			
			value_subject_vote["labels"].push(edit_value.value as string);
			value_subject_vote["data"].push({ "label":edit_value.value as string , "value": seleclt_itemID, "member": [] });
			
			var item :Discord.MessageSelectOptionData = {label:String(edit_value.value) , value: seleclt_itemID };

			select.addOptions(item);
			
			component_data.components[0] = select;
			console.log( select );


			await message_m.edit( Cast_MessageEditOptions(message_m) );
			await setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index);
			await interaction.reply({content: "**【報告】**項目を追加しました", ephemeral: true});
		}

	}else if( edit_mode.value === "label_del" ){

		var del_index = value_subject_vote["labels"].findIndex(text => text === String(edit_value.value) );
		if(del_index == -1){
			await interaction.reply({content: "**【ERROR】**削除する項目がありませんでした", ephemeral: true});
			return;
		};

		value_subject_vote["labels"].splice(del_index, 1);
		value_subject_vote["data"].splice(del_index, 1);

		if(message_m.embeds.length !== 0 && value_subject_vote["mode"] === "all"){
			var field_data = message_m.embeds[0].fields;
			//embed_data.( edit_value.value as string , "_[ NotVoted ]_" );
			field_data.splice(del_index, 1);
			message_m.embeds[0].setFields(field_data);
		}

		if(message_m.components.length !== null){
			var component_data = message_m.components[0];
			var select = component_data.components[0] as Discord.MessageSelectMenu;
			//var seleclt_itemID = "item" + String(del_index+1);

			if(select.options.length <= 2) {
				await interaction.reply({content: "**【ERROR】**選択項目が少なすぎて削除できませんでした。", ephemeral: true});
				return ;	
			}

			select = select.spliceOptions(del_index, 1);
			component_data.components[0] = select;

			await message_m.edit( Cast_MessageEditOptions(message_m) );
			await setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index);
			await interaction.reply({content: "**【報告】**該当項目を削除しました", ephemeral: true});

		}

	}else if( edit_mode.value === "choice_count" ){

		if(message_m.components.length !== null && Number(edit_value.value) != NaN){
			var component_data = message_m.components[0];
			if(component_data.components[0] == null) return;

			var select = component_data.components[0] as Discord.MessageSelectMenu;
			select.setMaxValues( Number(edit_value.value) );
			await message_m.edit( Cast_MessageEditOptions(message_m) );
			await interaction.reply({content: "**【報告】**選択可能項目数を変更しました", ephemeral: true});
		}else{
			await interaction.reply({content: "**【ERROR】**選択可能項目数を変更できませんでした", ephemeral: true});
		}

	}else if( edit_mode.value === "limit_time" ){

		if( Number(edit_value.value) == NaN ){
			await interaction.reply({content: "**【ERROR】**制限時間を変更できませんでした。", ephemeral: true});
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
		await interaction.reply({content: "**【報告】**制限時間を変更しました", ephemeral: true});
	}

	} catch(error){
		console.log(error);
	}

}


export async function getSelectMenu(client: Discord.Client, config: Object, interaction: Discord.SelectMenuInteraction) : Promise<Boolean> {
	//try{
	
	var VoteBoxData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));
	// 投票Bot情報が無ければ、何もしない。
	if(VoteBoxData == null){
		//await interaction.reply({content:"【EEROR】問題が発生しました。Bot管理者にご相談ください。", ephemeral:true});
		return false;
	}

	var VoteItem = VoteBoxData.find(element => 
		element["MessageID"] != null && element["MessageID"] === String(interaction.message.id) &&
		element["channelID"] != null && element["channelID"] === String(interaction.channelId)
	);
	// 該当する投票Botが無ければ...何もしない
	if(VoteItem == null){
		//await interaction.reply({content:"【EEROR】問題が発生しました。Bot管理者にご相談ください。", ephemeral:true});
		return false;
	}

	await interaction.reply({content: "**【作業中】**少々お待ちください。" + channelSend.text_check("_(:3」∠)_") , ephemeral: true});

	// ymlデータの更新
	for(var value of VoteItem["data"]){
		// 選択されている
		if( interaction.values.findIndex( text => text === value["value"] ) != -1 ){
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
	await fs.promises.writeFile(config["vote_tmp_filepath"], yaml.dump(VoteBoxData));
	

	// 表の更新
	var t_message = await f_message(client, VoteItem);
	// 全部表示モード
	if(VoteItem["mode"] === "all"){
		var field = t_message.embeds[0].fields;
		for(var value of VoteItem["data"]){
			var field_data = field.find(item => item.name === value["label"]);
			if(field_data == null) continue;

			if(value["member"] == null || value["member"] == [] ){
				field_data.value = "_[ NotVoted ]_";
			}else{
				// 各項目の情報を編集
				var displayName_list = "";
				for(var userID of value["member"]){
					await client.guilds.fetch();
					var guild = client.guilds.cache.get(VoteItem["guildID"]);
					await guild.members.fetch();
					var member = guild.members.cache.get(userID);
					await member.fetch();

					displayName_list += channelSend.text_check( member.displayName ) + "\n";
				}
				if(displayName_list === ""){
					displayName_list = "_[ NotVoted ]_";
				}
				field_data.value = displayName_list;
			}
		}
		t_message.embeds[0].fields = field;
		await t_message.edit({
			content: t_message.content,
			embeds: t_message.embeds,
			components: t_message.components
		});
		await interaction.editReply({content: "投票箱「" + VoteItem["Title"] + "」に投票しました" });
	}

	// 数だけ表示モード
	else if(VoteItem["mode"] === "count"){
		var field = t_message.embeds[0].fields;

		var field_data = field.find(item => item.name === "Count");
		if(field_data == null) return;

		var send_text = "";
		for(var value of VoteItem["data"]){
			if(value["member"] == null || value["member"] == [] ){
				send_text += value["label"] + " : " + "0" + "\n";
				//field_data.value = channelSend.text_check("まだ誰も投票してません (´・ω・｀)")
			}else{
				// 各項目の情報を編集
				var member_count = 0;
				for(var userID of value["member"]){
					member_count += 1;
				}
				send_text += value["label"] + " : " + String(member_count) + "\n";
			}
		}		
		field_data.value = send_text;

		t_message.embeds[0].fields = field;
		await t_message.edit({
			content: t_message.content,
			embeds: t_message.embeds,
			components: t_message.components
		});
		await interaction.editReply({content: "投票箱「" + VoteItem["Title"] + "」に投票しました" });
	}
	else if(VoteItem["mode"] === "none"){
		await interaction.editReply({content: "投票箱「" + VoteItem["Title"] + "」に投票しました" });
	}
	//}catch(error){
	//	console.log(error);
	//}
	
	return true;
}

export async function deleteVote(client: Discord.Client, config: Object, interaction: Discord.CommandInteraction) {
	try{
	
		var vote_fileData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));
	
		var subject_vote = interaction.options.get( 'subject_vote' );
		if (subject_vote == null || subject_vote.value == null || String(subject_vote.value) === ""){
			return;
		}
	
		// 選択肢Boxの情報取得
		var value_subject_vote = vote_fileData.find(element => element["VoteBoxID"] != null && element["VoteBoxID"] === String(subject_vote.value) );
		var value_subject_vote_index = vote_fileData.findIndex(element => element["VoteBoxID"] != null && element["VoteBoxID"] === String(subject_vote.value) );
	
		//console.log("value_subject_vote  =>>> " , value_subject_vote);
		if(value_subject_vote == null) return;

		await interaction.reply({content: "**【作業中】**少々お待ちください。" + channelSend.text_check("_(:3」∠)_") , ephemeral: true});

		if( value_subject_vote["makeUserID"] !== interaction.user.id ){
			await interaction.editReply({content: "**【ERROR】**あなたは、この投票箱を作成した人ではないため、処理できませんでした。"});
			return;
		}
	
		// 編集情報の確認	
		var message_m = await f_message(client, value_subject_vote);
		if(message_m == null){
			await interaction.editReply({content: "**【ERROR】**編集するべきメッセージが見つかりませんでした"});
			return;
		}

		var select = message_m.components[0].components[0] as Discord.MessageSelectMenu;
		if(select != null){
			message_m.content = "**≪ -- 投票ボックス -- ≫**";
			message_m.embeds[0].setDescription("この投票箱の受け付けは、終了しました。\n" + channelSend.text_check("ヽ(ﾟ∀ﾟ)ﾒ(ﾟ∀ﾟ)ﾒ(ﾟ∀ﾟ)ﾉ 協力ありがとう☆"));
			message_m.embeds[0].setColor('ORANGE');
			select.setDisabled(true);
			await message_m.edit( Cast_MessageEditOptions(message_m) );

			vote_fileData.splice(value_subject_vote_index, 1);
			await fs.promises.writeFile(config["vote_tmp_filepath"], yaml.dump(vote_fileData));

			await init_VoteCommand_subject_vote(config);			

			var text = "投票欄「" + value_subject_vote["Title"] + "」の受け付けを、終了しました。";
			var ephemeral_value = interaction.options.get( 'show_result' );
			if(ephemeral_value == null || ephemeral_value.value as Boolean == false){
				//await interaction.editReply({content:text, ephemeral: false});
				//await interaction.followUp({content:"最終結果です。\n（警告：この表示は時間が経つと消えます）", embeds: [ await ResultMessage(client, config, interaction, value_subject_vote) ], ephemeral: true});
				await interaction.editReply({content:"最終結果です。\n（警告：この表示は時間が経つと消えます）", embeds: [ await ResultMessage(client, config, interaction, value_subject_vote) ] });
				await interaction.followUp({content:text, ephemeral: false});
			}else{
				await interaction.followUp({content:text , embeds: [ await ResultMessage(client, config, interaction, value_subject_vote) ] , ephemeral: false });
			}
		}

	}catch (error){

	}
}


async function roleSort(client: Discord.Client, config: Object, interaction: Discord.CommandInteraction, guildID: string, idList: Array<string>) : Promise<Array<Discord.GuildMember>>{
	var members : Array<Discord.GuildMember> = [];
	
	for(var userID of idList){
		await client.guilds.fetch();
		var guild = client.guilds.cache.get(guildID);
		await guild.members.fetch();
		var member = guild.members.cache.get(userID);
		await member.fetch();

		members.push( member );
	}

	/// ここにソート処理を書く。
	var sortData : Array<Discord.GuildMember> = [];
	var af_member_sortData : Array<Discord.GuildMember> = [];
	
	var sort_hit = false;
	for(var i = 1; i <= 3; i++){
		var member_sortData : Array<Discord.GuildMember> = [];

		var option_name = "role_sort_no" + String(i); 
		var opt_role_sort = interaction.options.get(option_name);
		if(opt_role_sort == null) continue;
		else sort_hit = true;

		for(var member_item of members){
			var item = member_item.roles.cache.map(role => role.id === opt_role_sort.role.id);
			if(item.length != 0){
				member_sortData.push(member_item);
			}
		}

		if(af_member_sortData == [] || af_member_sortData == null){		
			af_member_sortData = member_sortData;
			sortData = member_sortData;
		}else{
			sortData = sortData.concat( member_sortData.filter(itemA => af_member_sortData.indexOf(itemA) == -1) );
			af_member_sortData = member_sortData;
		}
	}
	// ソートしてないなら...データをそのまま渡す。
	if( sort_hit == false){
		sortData = members;
	}
	return sortData;
	//return members;
}

async function ResultMessage(client: Discord.Client, config: Object, interaction: Discord.CommandInteraction, value_subject_vote) : Promise<Discord.MessageEmbed > {
	//var content_text = "";
	var send_embed : Discord.MessageEmbed = new Discord.MessageEmbed();
	send_embed.setTitle("投票箱「"+ value_subject_vote["Title"] + "」の投票結果");
	for(var subject_data of value_subject_vote["data"]){
		var field_text = "";

		var members = await roleSort(client, config, interaction, value_subject_vote["guildID"], subject_data["member"]);
		for(var member_item of members){
			//console.log(member_item.displayName);
			field_text += channelSend.text_check(member_item.displayName) + "\n";
		}
		if(field_text == ""){
			field_text = "_[ NotVoted ]_";
		}
		send_embed.addField(subject_data["label"], field_text);
	}
	return send_embed;
}

export async function infoVote(client: Discord.Client, config: Object, interaction: Discord.CommandInteraction) {
	try{
		await interaction.reply({content: "**【作業中】**少々お待ちください。" + channelSend.text_check("_(:3」∠)_") , ephemeral: true});

		var vote_fileData = yaml.load(fs.readFileSync(config["vote_tmp_filepath"], 'utf8'));
	
		var subject_vote = interaction.options.get( 'subject_vote' );
		if (subject_vote == null || subject_vote.value == null || String(subject_vote.value) === ""){
			return;
		}
	
		// 選択肢Boxの情報取得
		var value_subject_vote = vote_fileData.find(element => element["VoteBoxID"] != null && element["VoteBoxID"] === String(subject_vote.value) );
		var value_subject_vote_index = vote_fileData.findIndex(element => element["VoteBoxID"] != null && element["VoteBoxID"] === String(subject_vote.value) );
	
		async function setYOMLData(vote_fileData, value_subject_vote, value_subject_vote_index){
			vote_fileData[value_subject_vote_index] = value_subject_vote;
			await fs.promises.writeFile(config["vote_tmp_filepath"], yaml.dump(vote_fileData));
			return;
		}
	
		//console.log("value_subject_vote  =>>> " , value_subject_vote);
		if(value_subject_vote == null) return;

		if( value_subject_vote["makeUserID"] !== interaction.user.id ){
			await interaction.editReply({content: "**【ERROR】**あなたは、この投票箱を作成した人ではないため、処理できませんでした。"});
			return;
		}

		await interaction.editReply({content:"**【投票箱 途中結果】**\n（警告：この表示は時間が経つと消えます）" , embeds: [ await ResultMessage(client, config, interaction, value_subject_vote) ] });
	}catch (error){
		console.log(error);
	}
}