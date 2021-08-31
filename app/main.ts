const {AppManager} = require('./util/app');

var app = new AppManager();

async function app_run(){
	await app.load();
	await app.init_SlashCommands();
	await app.run();
}

process.on("exit", exitCode => {
	app.client.destroy();
	console.log(" ---------- ボット終了するぜー！ ----------");
});
process.on("SIGINT", ()=>process.exit(0));

app_run().then();