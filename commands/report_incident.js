import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('report_incident')
		.setDescription('2319! Report the incident immediately!')
        .addStringOption(option => option.setMinLength(5).setMaxLength(500).setDescription("Details of the incident").setRequired(false).setName("details")),

	async execute(interaction, db) {
        const details = interaction.options.getString('details') || 'No details provided'; 
        const result = await db.run(
            'INSERT INTO incidents (details, created_at, user) VALUES (?, ?, ?)',
            [details, new Date().getTime(), interaction.user.id]
        );
		await interaction.reply(`Incident reported successfully. Number: ${result.lastID}`);
	},
};
