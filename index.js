import { Client, Events, GatewayIntentBits, REST, Routes, MessageFlags } from 'discord.js';
import config from './secret.json' assert { type: 'json' };
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const { CLIENT_ID, GUILD_ID, DATABASE_PATH, TOKEN } = config;

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const foldersPath = path.join(__dirname, 'commands');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [];
client.commands = new Map();

// Check for files in the 'commands' folder (not just directories)
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(foldersPath, file);
	
	// Dynamically import the command file
	const command = (await import(filePath)).default
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
		commands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const rest = new REST().setToken(TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

let db;

const createTable = async (TABLE) => {
	await db.run("CREATE TABLE IF NOT EXISTS "+TABLE);
	console.log(TABLE.split(" ")[0]+': Table created or already exists.');
}

// Initialize Database Connection
(async () => {
    try {
		console.log("Connecting to database")

        db = await open({
            filename: DATABASE_PATH,
            driver: sqlite3.cached.Database,
        })

        console.log('Database connection established')

		console.log("Creating Tables")
		createTable(
			`incidents (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				details TEXT NOT NULL,
				created_at BIGINT NOT NULL,
				user TEXT NOT NULL
			);`
		)

		createTable(
			`chat (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				message TEXT NOT NULL,
				user TEXT NOT NULL,
				is_arthur BOOLEAN NOT NULL
			);`
		)

		client.login(TOKEN)
    } catch (error) {
        console.error('Error Starting:', error.message)
    }
})();

// Bot Ready Event
client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
    if (db) {
        await db.close();
        console.log('Database connection closed');
    }
    process.exit(0);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction, db);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});
