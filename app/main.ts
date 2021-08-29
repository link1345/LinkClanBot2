const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const yaml = require('js-yaml');
const fs   = require('fs');

const base_doc = yaml.load(fs.readFileSync('./config/base.yml', 'utf8'));

const commands = [{
	name: 'ping',
	description: 'test2 Replies with Pong!'
}]; 

const rest = new REST({ version: '9' }).setToken(base_doc["TOKEN"]);


async function test (){
	try {
		console.log('Started refreshing application (/) commands.');
		
		await rest.put(
			Routes.applicationGuildCommands(base_doc["CLIENT_ID"], base_doc["GUILD_ID"]),
			{ body: commands },
		);
		
		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
	
}
test();

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });


client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	console.log("id : " , interaction.commandId )

	if (interaction.commandName === 'ping') {
		await interaction.reply('Pong!');
	}
});

client.login(base_doc["TOKEN"]);