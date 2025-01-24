import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('rps')
		.setDescription('Rock Paper Scissors')
		.addStringOption(option=>option.setName("blowjob").setDescription("are fun").setRequired(true)),
	async execute(interaction) {
		await interaction.reply("`Hello World.`"+interaction.options.getString("blowjob"));
	},
};
