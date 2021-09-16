import {AppManager} from './util/app';

var app = new AppManager();

async function app_run(){
	await app.load();
	//await app.init_SlashCommands();  //やらない
	app.run();
}

process.on("SIGINT", ()=>{
	app.exit();	
});

app_run().then();