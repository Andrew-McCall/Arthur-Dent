import config from '../secret.json' assert { type: 'json' };
import { SlashCommandBuilder } from 'discord.js';
import ollama from 'ollama'

const { PROMPT } = config;

export default {
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Chat with Arthur Dent'),
    
	async execute(interaction, db) {
        const message = interaction.options.getString("message")

        try {
            await db.run(
                'INSERT INTO chat (message, user, is_arthur) VALUES (?, ?, ?)',
                [message, interaction.user.id, false]
            );
        }catch (error){
            console.error(error);
            await interaction.reply('An error occurred while fetching the past messages.');
            return;
        }

        let result;
        try {
            result = await db.get(`SELECT FIRST 10 id, message, user, is_arthur FROM incidents WHERE user = ? ORDER BY ID DESC`, [interaction.user.id]);
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the past messages.');
            return;
        }

        const combinedMessages = result.reduce((acc, curr) => {
            return acc + `\n[${curr.is_arthur ? "you (Arthur Dent)" : interaction.user.displayName}] ${curr.message}`;
        }, '');

        let ai;
        try {
            ai = await ollama.generate({
                model:"llama3.2",
                keep_alive:"1h",
                stream:false,
                prompt: PROMPT + combinedMessages
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
            await interaction.reply('An error occurred while fetching the past messages.');
            return;
        }

		await interaction.reply(ai.response);
	},
};
