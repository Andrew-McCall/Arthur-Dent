import { Client, Events, GatewayIntentBits, REST, Routes, MessageFlags } from 'discord.js';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import ollama from 'ollama'
import { readFileSync } from 'fs';

const data = readFileSync('./.secret.json', 'utf-8');
const config = JSON.parse(data);

global.config = config
import { registerFont, loadImage, createCanvas } from 'canvas';
import { differenceInHours } from 'date-fns';

const affirmation_image = await loadImage('./affirmation_template.jpg');
registerFont("./dancing-script/Dancing Script.ttf", { family: 'Dancing Script' });

const { CLIENT_ID, GUILD_ID, DATABASE_PATH, TOKEN, PROMPT, AFFIRMATION_CHANNEL, AFFIRMATION_ROLE } = config;

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const foldersPath = path.join(__dirname, 'commands');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

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
    await db.run("CREATE TABLE IF NOT EXISTS " + TABLE);
    console.log(TABLE.split(" ")[0] + ': Table created or already exists.');
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
				created_at INTEGER NOT NULL,
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

        createTable(
            `affirmations (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				affirmation TEXT NOT NULL,
				author TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                used_at INTEGER NOT NULL DEFAULT 0
			);`
        )

        client.login(TOKEN)
    } catch (error) {
        console.error('Error Starting:', error.message)
    }
})();

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
}


let background_tasks;
let last_affirmation;

// Bot Ready Event
client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    if (background_tasks) {
        return
    }

    background_tasks = setInterval(async () => {
        if (!last_affirmation) {
            try {
                const result = await db.get(
                    "SELECT MAX(used_at) as max_used_at FROM affirmations"
                )
                last_affirmation = result.max_used_at
            } catch (error) {
                console.error(error);
                return
            }
        }

        const now = new Date();

        if ((now.getTime() - last_affirmation) > 86100000 && (now.getHours() === 9) && (now.getMinutes() === 0)) {
            try {
                const result = await db.get(
                    "SELECT id, affirmation FROM affirmations ORDER BY RANDOM() LIMIT 1"
                )

                await db.run(
                    "UPDATE affirmations SET used_at = ? WHERE id = ?",
                    [now.getTime(), result.id]
                )

                last_affirmation = now.getTime();

                let channel = await client.channels.cache.get(AFFIRMATION_CHANNEL);
                if (!channel) {
                    channel = await client.channels.fetch(AFFIRMATION_CHANNEL);
                }
                if (!channel) {
                    throw Error("Unable to find affirmation channel. Please check AFFIRMATION_CHANNEL in the config file.")
                }

                const canvas = createCanvas(affirmation_image.width, 300);
                const ctx = canvas.getContext('2d');

                ctx.drawImage(affirmation_image, 0, Math.floor(-100 + Math.random() * 100));

                ctx.fillStyle = '#36454F'; // charcoal hex
                ctx.font = 'Bold 40px "Dancing Script"';

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                wrapText(ctx, result.affirmation, canvas.width / 2, canvas.height / 2, Math.floor(canvas.width * 0.8), 45);

                const attachment = {
                    files: [
                        {
                            attachment: canvas.toBuffer(),
                            name: 'daily_affirmation.jpg'
                        }
                    ]
                };

                await channel.send({ content: `<@&${AFFIRMATION_ROLE}>`, files: attachment.files });
            } catch (error) {
                console.error(error);
                return
            }
        }
    }, 20000)
});

// Graceful Shutdown
process.on('SIGINT', async () => {
    if (background_tasks) {
        clearInterval(background_tasks);
    }
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


client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.reference) {
        const repliedToMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (repliedToMessage.author.id === client.user.id) {
            const msg = message.content
            await message.channel.sendTyping();

            try {
                await db.run(
                    'INSERT INTO chat (message, user, is_arthur) VALUES (?, ?, ?)',
                    [msg, message.author.id, false]
                );
            } catch (error) {
                console.error(error);
                await message.reply('An error occurred while creating message.');
                return;
            }

            let result;
            try {
                result = await db.all(`SELECT id, message, user, is_arthur FROM chat WHERE user = ? ORDER BY ID DESC LIMIT 10`, [message.author.id]);
            } catch (error) {
                console.error(error);
                await message.reply('An error occurred while fetching the past messages.');
                return;
            }

            result.push({ message: repliedToMessage.content, is_arthur: true })

            const combinedMessages = result.reverse().reduce((acc, curr) => {
                return acc + `\n[${curr.is_arthur ? "you (Arthur Dent)" : message.author.displayName}] ${curr.message}`;
            }, PROMPT);

            await message.channel.sendTyping();
            let ai;
            try {
                ai = await ollama.generate({
                    model: "llama3.2",
                    keep_alive: "1h",
                    stream: false,
                    prompt: combinedMessages
                })
            } catch (error) {
                console.error(error);
                await message.reply('An error occurred while thinking.');
                return;
            }

            if (!ai.response) {
                console.error(error);
                await message.reply('An error occurred while thinking.');
                return;
            }

            try {
                await db.run(
                    'INSERT INTO chat (message, user, is_arthur) VALUES (?, ?, ?)',
                    [ai.response, message.author.id, true]
                );
            } catch (error) {
                console.error(error);
                await message.reply('An error occurred while saving the thought.');
                return;
            }

            await message.reply(ai.response || ".");
        }
    }
});
