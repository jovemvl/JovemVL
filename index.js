require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { Player, QueryType } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");

const PREFIX = "j!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = new Player(client);

client.once("clientReady", async () => {
  await player.extractors.loadMulti(DefaultExtractors);

  console.log(`✅ ${client.user.tag} está online!`);
  client.user.setActivity("j!ajuda | j!play");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "p" || command === "ping") {
    return message.reply("🏓 Pong!");
  }

  if (command === "h" || command === "ajuda") {
    const embed = new EmbedBuilder()
      .setColor("#8b5cf6")
      .setTitle("🤖 JovemVL - Comandos")
      .setDescription("Prefixo: `j!`")
      .addFields(
        { name: "🎵 Música", value: "`j!play música`\n`j!pl música`\n`j!pause`\n`j!resume`\n`j!skip`\n`j!stop`\n`j!fila`\n`j!tocando`" },
        { name: "🎮 Diversão", value: "`j!p`\n`j!moeda`\n`j!dado`\n`j!avatar`\n`j!userinfo`\n`j!serverinfo`" },
        { name: "🛡️ Moderação", value: "`j!limpar 10`" }
      );

    return message.reply({ embeds: [embed] });
  }

  if (command === "avatar" || command === "av") {
    return message.reply(message.author.displayAvatarURL({ size: 1024 }));
  }

  if (command === "moeda") {
    return message.reply(Math.random() < 0.5 ? "🪙 Cara!" : "🪙 Coroa!");
  }

  if (command === "dado") {
    const numero = Math.floor(Math.random() * 6) + 1;
    return message.reply(`🎲 Você tirou **${numero}**`);
  }

  if (command === "userinfo" || command === "ui") {
    const user = message.mentions.users.first() || message.author;

    const embed = new EmbedBuilder()
      .setColor("#22c55e")
      .setTitle(`👤 ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "ID", value: user.id },
        { name: "Conta criada em", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` }
      );

    return message.reply({ embeds: [embed] });
  }

  if (command === "serverinfo" || command === "si") {
    const guild = message.guild;

    const embed = new EmbedBuilder()
      .setColor("#3b82f6")
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Membros", value: `${guild.memberCount}`, inline: true },
        { name: "ID", value: guild.id, inline: true },
        { name: "Criado em", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>` }
      );

    return message.reply({ embeds: [embed] });
  }

  if (command === "limpar") {
    if (!message.member.permissions.has("ManageMessages")) {
      return message.reply("❌ Você não tem permissão para limpar mensagens.");
    }

    const quantidade = parseInt(args[0]);

    if (!quantidade || quantidade < 1 || quantidade > 100) {
      return message.reply("Use: `j!limpar 1-100`");
    }

    await message.channel.bulkDelete(quantidade, true);
    return message.channel.send(`🧹 ${quantidade} mensagens apagadas.`)
      .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
  }

  if (command === "play" || command === "pl") {
    const query = args.join(" ");

    if (!query) return message.reply("❌ Use: `j!play nome da música`");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Entre em um canal de voz primeiro.");

    try {
      const searchResult = await player.search(query, {
        requestedBy: message.author,
        searchEngine: QueryType.AUTO
      });

      if (!searchResult.hasTracks()) {
        return message.reply("❌ Não encontrei essa música.");
      }

      const { track } = await player.play(voiceChannel, searchResult, {
        nodeOptions: {
          metadata: {
            channel: message.channel,
            requestedBy: message.author
          },
          volume: 70,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 30000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 30000
        }
      });

      return message.reply(`🎶 Tocando agora: **${track.title}**`);
    } catch (error) {
      console.log(error);
      return message.reply("❌ Deu erro ao tentar tocar a música.");
    }
  }

  if (command === "pause") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) return message.reply("❌ Não tem música tocando.");

    queue.node.pause();
    return message.reply("⏸️ Música pausada.");
  }

  if (command === "resume") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) return message.reply("❌ Não tem música tocando.");

    queue.node.resume();
    return message.reply("▶️ Música retomada.");
  }

  if (command === "skip" || command === "sk") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) return message.reply("❌ Não tem música tocando.");

    queue.node.skip();
    return message.reply("⏭️ Música pulada.");
  }

  if (command === "stop" || command === "st") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) return message.reply("❌ Não tem música tocando.");

    queue.delete();
    return message.reply("⏹️ Música parada e fila limpa.");
  }

  if (command === "fila" || command === "queue") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) return message.reply("❌ Não tem música tocando.");

    const tracks = queue.tracks.toArray().slice(0, 10);

    const fila = tracks.length
      ? tracks.map((t, i) => `${i + 1}. ${t.title}`).join("\n")
      : "A fila está vazia.";

    return message.reply(`🎵 Tocando agora: **${queue.currentTrack.title}**\n\n📜 Fila:\n${fila}`);
  }

  if (command === "tocando" || command === "np") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) return message.reply("❌ Não tem música tocando.");

    return message.reply(`🎧 Tocando agora: **${queue.currentTrack.title}**`);
  }
});

player.events.on("playerStart", (queue, track) => {
  queue.metadata.channel.send(`🎧 Agora tocando: **${track.title}**`);
});

client.login(process.env.TOKEN);
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("JovemVL está online!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Servidor web rodando na porta ${PORT}`);
});