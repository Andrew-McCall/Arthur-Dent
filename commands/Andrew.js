import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('Andrew')
		.setDescription('Test command.'),
	async execute(interaction) {
		await interaction.reply("`#Andrew sucks`");
	},
};
