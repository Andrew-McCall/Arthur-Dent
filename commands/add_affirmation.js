import { SlashCommandBuilder } from 'discord.js';

const { AFFIRMATION_USERS } = global.config;

export default {
  data: new SlashCommandBuilder()
    .setName('add_affirmation')
    .setDescription('Add an affirmation to database.')
    .addStringOption(option => option.setName("affirmation").setDescription("Affirmation").setRequired(true)),
  async execute(interaction, db) {
    if (!AFFIRMATION_USERS.includes(interaction.user.id)) {
      await interaction.reply('You do not have permission to use this command.');
      return;
    }

    let affirmation = interaction.options.getString("affirmation").trim();

    if (!affirmation || affirmation.length < 5) {
      await interaction.reply('Please provide a valid affirmation. \n*It must be at least 5 characters long.*');
      return;
    }


    try {
      const exists = await db.get(
        'SELECT id FROM affirmations WHERE affirmation = ?',
        [affirmation]
      );

      if (exists) {
        await interaction.reply('This affirmation already exists in the database.');
        return;
      }

      await db.run(
        'INSERT INTO affirmations (affirmation, author, created_at, used_at) VALUES (?, ?, ?, ?)',
        [affirmation, interaction.user.id, Date.now(), -1]
      );
    } catch (error) {
      console.error(error);
      await interaction.reply('An error occurred while saving the affirmation.');
      return;
    }

    let result;
    try {
      result = await db.get(
        'SELECT COUNT(id) as affirmation_count FROM affirmations',
      );
    } catch (error) {
      console.error(error);
      await interaction.reply('An error occurred while fetching the affirmations.');
      return;
    }

    await interaction.reply(`Affirmation saved successfully.\n\`${affirmation}\`\nTotal affirmations: ${result.affirmation_count}`);
  }

};
