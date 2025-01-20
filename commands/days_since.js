import { SlashCommandBuilder } from 'discord.js';
import { intervalToDuration } from "date-fns"

export default {
	data: new SlashCommandBuilder()
		.setName('incident_since')
		.setDescription('Time since last incident.'),
	async execute(interaction, db) {
        let result;
        try {
            result = await db.get('SELECT MAX(created_at) as "MAX" FROM incidents');
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the incident.');
            return;
        }

        if (result && result.MAX) {
            const createdAt = new Date(result.MAX);
            const now = new Date();

            const difference = intervalToDuration({
                start: createdAt,
                end: now,
            });

            const durationString = `${difference.years ? `${difference.years} year(s) ` : ''}${difference.months ? `${difference.months} month(s) ` : ''}${difference.days ? `${difference.days} day(s) ` : ''}${difference.hours ? `${difference.hours} hour(s) ` : ''}${difference.minutes ? `${difference.minutes} minute(s) ` : ''}${difference.seconds ? `${difference.seconds} second(s) ` : ''}`;

            await interaction.reply(`The most recent incident was reported ${durationString}ago.`);
        } else {
            await interaction.reply('No incidents found in the database.');
        }
	},
};
