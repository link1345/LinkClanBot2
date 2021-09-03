
import * as Discord from 'discord.js';

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { time } from 'console';
import { DefaultDeserializer } from 'v8';

//const dfd = require("danfojs-node");

import * as dfd from 'danfojs-node';


// ロールに合うメンバーを返す。
async function UserRoleMember( client: Discord.Client, RoleList: Array<String>) {
	var hit = 0;

	await client.guilds.fetch();
	var guilds = client.guilds.cache.map(guild => guild);

	var return_Members: Array<Discord.GuildMember> = [];
	for( var guild_item of guilds){
		await guild_item.members.fetch();
		var members = guild_item.members.cache.map(guildmember => guildmember);
		for(var member_item of members){
			await member_item.fetch();
			var role_userList = member_item.roles.cache.map(role => role.id);

			for(var s_Role of role_userList){
				if( RoleList.includes(s_Role) ){
					return_Members.push(member_item);
					hit = 1;
					break;
				}
			}
			if (hit == 1) break;
		}
		if (hit == 1) break;
	}
	return return_Members;
}

export async function MakeTimeList( client: Discord.Client, Datafile_path: string , RoleList: Array<String> ) :  Promise<dfd.DataFrame>{
//export async function MakeTimeList( client: Discord.Client, Datafile_path: string , RoleList: Array<String> ) {

	// ユーザーリスト取得
	var members = await UserRoleMember(client, RoleList);
	//console.log("out : " , members );

	var members_id =  members.map(member => member.id) ;

	// ログを取得
	var baseData = yaml.load(fs.readFileSync(Datafile_path, 'utf8'));


	//var returnData = new dfd.DataFrame([]);
	var return_data = { 
		'name': members_id,
		'start': new Array( members_id.length ),
		'exit': new Array( members_id.length ),
		'time': new Array( members_id.length ),
	};

	//console.log("return => " , return_data);

	for(var item of baseData){
		var indexNum = 0;
		indexNum = members_id.indexOf(item['member.id']);
		if(indexNum == -1){
			// 現在の鯖に存在しない人は、処理しない。
			continue;
		}

		if ( item["flag"] == "entry" ){
			return_data["start"][indexNum] = item["timestanp"];
		}
		else if (item["flag"] == "exit" ){
			
			// スタートがないのに、エンドがある場合
			if(return_data["start"][indexNum] == null){
				// そもそも入室してない扱いにする
				continue;
			}

			return_data["exit"][indexNum] = item["timestanp"];

			var a_stanp : Date = new Date( Number(return_data["start"][indexNum]) );
			var b_stanp : Date = new Date( Number(return_data["exit"][indexNum]) );

			var c_time : Date = new Date( b_stanp.getTime() - a_stanp.getTime() );
			if( return_data["time"][indexNum] == null){
				return_data["time"][indexNum] = c_time.getTime();
			}else{
				return_data["time"][indexNum] = ( new Date( (new Date( return_data["time"][indexNum] )).getTime() + c_time.getTime() ) ).getTime();
				//console.log(" time => "  , return_data["time"][indexNum]  ); 
			}

			return_data["start"][indexNum] = null;
			return_data["exit"][indexNum] = null;
 		} 
	}
	
	var num = 0;
	for( var time_item of  return_data["time"] ){
		// getTime は、ミリ秒が帰ってくる。ので…1000分の１で1秒となる。
		return_data["time"][num] = (new Date(time_item)).getTime() / 1000 / 60 / 60 ;

		num += 1;
	}

	var data : dfd.DataFrame = new dfd.DataFrame( return_data ); 

	data.drop({ columns: ["start", "exit"], axis: 1, inplace: true });

	//console.log("return => " , data);

	return data;
}
