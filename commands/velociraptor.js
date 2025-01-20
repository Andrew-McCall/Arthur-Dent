import { SlashCommandBuilder } from 'discord.js';
import { loadImage, createCanvas } from 'canvas';
import { differenceInHours } from 'date-fns';
const image = await loadImage('./template.jpg');

export default {
	data: new SlashCommandBuilder()
		.setName('velociraptor')
		.setDescription('Days since last incident in the form of a velociraptor.'),
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
			
			// Load the template image
			const canvas = createCanvas(image.width, image.height);
			const ctx = canvas.getContext('2d');
			
			// Draw the template image onto the canvas
			ctx.drawImage(image, 0, 0);

			// Add text to the image
			ctx.fillStyle = 'DarkRed';  // Text color
			ctx.font = 'bold 400px monospace';

			// Calculate text width
			const textWidth = ctx.measureText(differenceInHours(now, createdAt, { roundingMethod: 'round' })).width;

			// Center the text horizontally
			const x = (image.width - textWidth) / 2;
			const y = image.height - (image.height / 4.25); // Position vertically

			ctx.fillText(differenceInHours(now, createdAt, { roundingMethod: 'round' }), x, y);
			
			// Send the image with text as a buffer
			const attachment = {
				files: [
					{
						attachment: canvas.toBuffer(),
						name: 'modified-template.jpg'
					}
				]
			};

			await interaction.reply({ files: attachment.files });
		}else{
			interaction.reply('No incidents found in the database.')
		}
	},
};
