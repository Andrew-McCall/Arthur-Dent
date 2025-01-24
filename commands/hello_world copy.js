import { SlashCommandBuilder } from 'discord.js';
let count=0;
export default {
	data: new SlashCommandBuilder()
		.setName('count')
		.setDescription('Test command.'),
	async execute(interaction) {
		count=count+1
		await interaction.reply(count);
	},
};