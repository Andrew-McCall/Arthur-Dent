import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('andrew')
		.setDescription('Test command.'),
	async execute(interaction) {
		await interaction.reply("`#Andrew sucks`");
	},
};
