import { SlashCommandBuilder } from '@discordjs/builders';
import { format } from 'date-fns';

const pageSize = 20;

export default {
  data: new SlashCommandBuilder()
    .setName('list_affirmations')
    .setDescription('List all affirmations in the database.')
    .addNumberOption(opt =>
      opt
        .setName("page")
        .setDescription("Page Number (starting from 1)")
        .setRequired(false)
        .setMinValue(1)
    ),
  async execute(interaction, db) {
    const page = interaction.options.getNumber("page") || 1;
    if (page < 1) {
      await interaction.reply("Invalid Page Number");
      return;
    }

    const offset = (page - 1) * pageSize;

    let totalResult;
    try {
      totalResult = await db.get(
        'SELECT COUNT(id) as affirmation_count FROM affirmations'
      );
    } catch (error) {
      console.error(error);
      await interaction.reply('An error occurred while fetching the affirmations.');
      return;
    }

    let affirmations;
    try {
      affirmations = await db.all(
        'SELECT * FROM affirmations LIMIT ? OFFSET ?',
        pageSize,
        offset
      );
    } catch (error) {
      console.error(error);
      await interaction.reply('An error occurred while fetching the affirmations.');
      return;
    }

    if (affirmations.length === 0) {
      await interaction.reply(`No affirmations found on page **${page}**.`);
      return;
    }

    const affirmationList = affirmations
      .map((a, i) => `**${a.id}.** [${format(new Date(a.created_at), "YY-MM-dd")}/${a.used_at ? format(new Date(a.created_at), "YY-MM-dd") : "*never*"}] \`${a.affirmation}\` <${a.author}>`)
      .join('\n');

    await interaction.reply({
      content: `**Affirmations Page ${page}/${Math.ceil(totalResult.affirmation_count / pageSize)}** (Total: ${totalResult.affirmation_count})\n\n${affirmationList}\n`
    });
  }
};
