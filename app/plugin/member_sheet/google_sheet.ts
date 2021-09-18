import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';

import * as fs from 'fs';


export async function getDocment(config: Object) : Promise<GoogleSpreadsheet>{
	const creds = JSON.parse( fs.readFileSync(config["credentials_filepath"], 'utf8') );
	const doc : GoogleSpreadsheet = new GoogleSpreadsheet(config["GOOGLE_SPREADSHEET_KEY"]);
	await doc.useServiceAccountAuth(creds);
	await doc.loadInfo();
	return doc;
}

export async function check_tabel(config: Object , sheet: GoogleSpreadsheetWorksheet){
	//console.log(sheet);
	await sheet.loadHeaderRow();
	const rows = sheet.headerValues;

	const labels = config["SheetIndex"].map(data => data.label );

	//console.log(rows);
	//console.log(labels);

	var old_item = labels.filter(item => rows.indexOf(item) == -1);
	var new_item = rows.filter(item => labels.indexOf(item) == -1);
	
	//console.log(old_item);
	//console.log(new_item);

	if( old_item.length === 0 && new_item.length === 0 ){
		return true;
	}else{
		return false;
	}
	return false;
}

export async function getUserPoint(sheet : GoogleSpreadsheetWorksheet, id_point : Number, UserID: string) {
	var user_point = -1;

	await sheet.loadCells({
		startRowIndex: 0, endRowIndex : sheet.rowCount,
		startColumnIndex:id_point, 
	});
	//console.log( "sheet.columnCount " , sheet.rowCount );

	var null_count = 0;
	for( var y = 0; y < sheet.rowCount ; y++ ){
		if(null_count >= 5) break;
		
		var cell = sheet.getCell(y, id_point);

		//console.log( "id " , oldMember.user.id );
		//console.log( "cell " , cell.value );

		if( String(UserID) === String(cell.value) ) {
			user_point = y;	
			break;
		}

		if( String(cell.value) == "" || String(cell.value) == null ){
			null_count += 1;
		}
	}

	console.log( "user_point  " , user_point );
	return user_point;
}


/*
export async function DataDiff(CheckList: Array<Boolean>,data1: Array<String>, data2: Array<String>) :Promise<Array<Number>> {
	var setPoint :Array<Number> = [];
	for(var i = 0; i < CheckList.length; i++){
		if( data1[i] !== data2[i] && CheckList[i] === true ){
			setPoint.push(i);
		}
	}
	return setPoint;
}*/
