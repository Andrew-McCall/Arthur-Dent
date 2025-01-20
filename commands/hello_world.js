import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('hello_world')
		.setDescription('Test command.'),
	async execute(interaction) {
		await interaction.reply("`Hello World.`");
	},
};
