import { SlashCommandBuilder } from 'discord.js';
let count = 0;
export default {
	data: new SlashCommandBuilder()
		.setName('count')
		.setDescription('Test command.'),
	async execute(interaction) {
		count = count + 1

		if (count > 10) {
			await interaction.reply("OMG THAT SOOOOOO BIG")

		} else {
			await interaction.reply(count + " poop");
		}

	},
};