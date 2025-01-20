import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {format} from "date-fns"

export default {
	data: new SlashCommandBuilder()
		.setName('incident')
		.setDescription('Search Incidents')
        .addNumberOption(option => option.setRequired(true).setName("incident_no").setMaxValue(1000).setMinValue(1).setDescription("Incident number to search")),

	async execute(interaction, db) {
        const id = interaction.options.getNumber("incident_no")
        let result;
        try {
            result = await db.get(
                'SELECT id, details, created_at, user FROM incidents WHERE id = ?',
                [id]
            );
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the incident.');
            return;
        }
        
        if (result) {
            const incidentEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`Incident #${result.id}`)
            .addFields(
                { name: 'Details', value: result.details || 'No details provided' },
                { name: 'Created By', value: `<@${result.user}>`, inline: true },
                { name: 'Created At', value: format(new Date(result.created_at), 'yyyy-mm-dd MM:hh'), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Incident Report' });

        // Send the embed in the reply
        await interaction.reply({ embeds: [incidentEmbed] });
        } else {
            await interaction.reply(`No incident found with ID ${id}`);
        }
	},
};
