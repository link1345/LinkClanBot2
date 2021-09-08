//const fs = require('fs');
//const readline = require('readline');
//const {google} = require('googleapis');


import * as fs from 'fs';
import * as readline from 'readline';
import {google, run_v1} from 'googleapis';
import { json } from 'stream/consumers';
import { OAuth2Client } from 'google-auth-library';


const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

async function init_googleSheet() {
	var content = fs.readFileSync('credentials.json', 'utf8');
	authorize(JSON.parse(content), listMajors );
}


async function authorize(credentials, callback) {


	const {client_secret, client_id, redirect_uris} = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2( client_id, client_secret, redirect_uris[0] );

	var token = "";
	try{
		token = (await fs.promises.readFile(TOKEN_PATH)).toString() ;
		oAuth2Client.setCredentials(JSON.parse(token));
	}catch{
		return await getNewToken(oAuth2Client, callback);
	}

}


async function getNewToken(oAuth2Client: OAuth2Client, callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('Authorize this app by visiting this url:', authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question('Enter the code from that page here: ', (code) => {
	rl.close();
	oAuth2Client.getToken(code, async(err, token) => {
		if (err) return console.error('Error while trying to retrieve access token', err);
		oAuth2Client.setCredentials(token);

		var write = await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token) );
		callback(oAuth2Client);
		});
	});
	//r1.question
}



function listMajors(auth) {
	
	
	const sheets = google.sheets({version: 'v4', auth});
	sheets.spreadsheets.values.get({
	spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
	range: 'Class Data!A2:E',
	}, (err, res) => {
	if (err) return console.log('The API returned an error: ' + err);
	const rows = res.data.values;
	if (rows.length) {
		console.log('Name, Major:');
		// Print columns A and E, which correspond to indices 0 and 4.
		rows.map((row) => {
		console.log(`${row[0]}, ${row[4]}`);
		});
	} else {
		console.log('No data found.');
	}
	});


}