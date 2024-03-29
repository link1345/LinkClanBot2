
import * as Discord from 'discord.js';

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { time } from 'console';
import { DefaultDeserializer } from 'v8';

//const dfd = require("danfojs-node");

import * as dfd from 'danfojs-node';

export async function most_oldMonth(config: Object) : Promise< Object >{

	var labels = []
	var fileNameList = []

	console.log("config output_TimeLine_folderpath : " , config)

	var files = await fs.promises.readdir( config["output_TimeLine_folderpath"] );

	//console.log("files : " , files)

	for( var old_month = 1 ; old_month < 13 ; old_month++ ){
		var move_day = new Date;
		move_day.setMonth( move_day.getMonth() - old_month );
		var year  = move_day.getFullYear();
		var month = ("0"+ Number(move_day.getMonth() + 1) ).slice(-2);

		var fileName = config["output_TimeLine_folderpath"] + year.toString() + month.toString() + ".yml" ;
		console.log(fileName);

		var find_id = files.indexOf(  year.toString() + month.toString() + ".yml"  );
		console.log( __dirname ," == ", fileName , " => " , find_id);
		if(find_id != -1){
			labels.push( year.toString() + "/" + month.toString() );
			fileNameList.push( fileName );
		}else{
			// 見つからなかったので検索はここで終わり。
			break;
		}
	}
	return {"fileList": fileNameList, "label": labels};
}


export async function table_MakeTimeList(client: Discord.Client, MonthFileList: Array<string>, Lables: Array<string> , RoleList: Array<String> ) :  Promise<dfd.DataFrame>{
	var members : Array<Discord.GuildMember>;
	if( MonthFileList ){
		members = await UserRoleMember(client, RoleList);
		
		console.log("members === " , members);
	}
	if (members == null){
		return null;
	}

	var all_df: dfd.DataFrame = null;
	for( var fileName of MonthFileList ){
		var df : dfd.DataFrame = await one_MakeTimeList(client,fileName, members);

		if ( df == null){
			break;
		}
		
		//console.log("make1 df === " , df);

		//console.log("labelID === " ,MonthFileList.indexOf(fileName)  );
		var labelName = Lables[MonthFileList.indexOf(fileName)];
		//console.log("labelName === " , labelName );
		//console.log("make2 df === " , df.rename({ mapper: {"time": labelName}}) );
		df = df.rename({ mapper: {"time": labelName}});
		
		if( MonthFileList.indexOf(fileName) == 0 ){
			all_df = df;
		}else{
			df.drop({ columns: ["display"], axis: 1, inplace: true });
			all_df = dfd.merge({ "left": df , "right": all_df, "on": ["name"]})
		}
	}

	//console.log("all_df === " , all_df);

	return all_df;
}

// ロールに合うメンバーを返す。
export async function UserRoleMember( client: Discord.Client, RoleList: Array<String>) : Promise<Array<Discord.GuildMember>>{
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
	var members = await UserRoleMember(client, RoleList);
	return await one_MakeTimeList(this.fix_client, Datafile_path, members);
}

export async function one_MakeTimeList( client: Discord.Client, Datafile_path: string , members : Array<Discord.GuildMember>  ) :  Promise<dfd.DataFrame>{

	// ユーザーリスト取得
	//var members = await UserRoleMember(client, RoleList);
	//console.log("out : " , members );

	var members_id =  members.map(member => member.id) ;
	var members_name =  members.map(member => member.user.username + "#" + member.user.discriminator) ;

	if ( members_id.length == 0 ) return;

	// ログを取得
	var baseData = yaml.load(fs.readFileSync(Datafile_path, 'utf8'));


	//var returnData = new dfd.DataFrame([]);
	var return_data = { 
		'name': members_id,
		'display':  members_name,
		'start': new Array( members_id.length ),
		'exit': new Array( members_id.length ),
		'time': new Array( members_id.length ),
	};

	for(var item of return_data["time"]){
		item = 0;
	}

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
