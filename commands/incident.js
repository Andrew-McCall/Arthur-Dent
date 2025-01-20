import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('report_incident')
		.setDescription('2319! Report the incident immediately!'),
	async execute(interaction) {
		await interaction.reply(`Fuck off!`);
	},
};
