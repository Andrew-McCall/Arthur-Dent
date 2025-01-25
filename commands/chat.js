import config from '../secret.json' assert { type: 'json' };
import { SlashCommandBuilder } from 'discord.js';
import ollama from 'ollama'

const { PROMPT } = config;

export default {
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Chat with Arthur Dent')
        .addStringOption(o => o.setName("message").setDescription("What would you like to say to Arthur?").setRequired(true))
        ,
    
	async execute(interaction, db) {
        await interaction.defer()
        
        const message = interaction.options.getString("message")

        try {
            await db.run(
                'INSERT INTO chat (message, user, is_arthur) VALUES (?, ?, ?)',
                [message, interaction.user.id, false]
            );
        }catch (error){
            console.error(error);
            await interaction.reply('An error occurred while creating message.');
            return;
        }

        let result;
        try {
            result = await db.all(`SELECT id, message, user, is_arthur FROM chat WHERE user = ? ORDER BY ID DESC LIMIT 10`, [interaction.user.id]);
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the past messages.');
            return;
        }

        const combinedMessages = result.reverse().reduce((acc, curr) => {
            return acc + `\n[${curr.is_arthur ? "you (Arthur Dent)" : interaction.user.displayName}] ${curr.message}`;
        }, PROMPT);

        let ai;
        try {
            ai = await ollama.generate({
                model:"llama3.2",
                keep_alive:"1h",
                stream:false,
                prompt: combinedMessages
            })
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while thinking.');
            return;
        }

        if (!ai.response){
            console.error(error);
            await interaction.reply('An error occurred while thinking.');
            return;
        }
        
        try {
            await db.run(
                'INSERT INTO chat (message, user, is_arthur) VALUES (?, ?, ?)',
                [ai.response, interaction.user.id, true]
            );
        }catch (error){
            console.error(error);
            await interaction.reply('An error occurred while saving the thought.');
            return;
        }

		await interaction.reply(`${interaction.user.displayName}: ${message}\n Arthur Dent: ${ai.response}`);
	},
};
