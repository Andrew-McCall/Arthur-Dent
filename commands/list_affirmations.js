import { SlashCommandBuilder } from '@discordjs/builders';
import { format } from 'date-fns';
import { A } from 'ollama/dist/shared/ollama.67ec3cf9.mjs';

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
    )
    .addStringOption(opt =>
      opt.addChoices(["simple", "debug", "debug_ping"])
        .setName("list")
        .setDescription("Display all database infomation?")
    ),
  async execute(interaction, db) {
    const page = interaction.options.getNumber("page") || 1;
    if (page < 1) {
      await interaction.reply("Invalid Page Number");
      return;
    }

    const is_simple = interaction.options.getString("list") == "simple"
    const is_pinging = interaction.options.getString("list") == "debug_ping"

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
      .map((a, i) => (is_simple
        ?
        `**${a.id}.** [${format(new Date(a.created_at), "yy-MM-dd")}/${a.used_at ? format(new Date(a.created_at), "yy-MM-dd") : "*never*"}] \`${a.affirmation}\` <${is_pinging ? "@" : ""}${a.author}>`
        :
        `**${a.id}** \`${a.affirmation}\``))
      .join('\n');

    await interaction.reply({
      content: `**Affirmations Page ${page}/${Math.ceil(totalResult.affirmation_count / pageSize)}** (Total: ${totalResult.affirmation_count})\n\n${affirmationList}\n`
    });
  }
};
