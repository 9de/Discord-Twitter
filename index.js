const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const { token, prefix } = require('./config.json');

class TwitterInfoBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.commands = new Map();
    this.setupCommands();
    this.setupEventHandlers();
  }

  setupCommands() {
    this.commands.set('twitter', {
      name: 'twitter',
      description: 'Get Twitter user information',
      execute: this.handleTwitterCommand.bind(this)
    });
  }

  setupEventHandlers() {
    this.client.on('ready', this.handleReady.bind(this));
    this.client.on('messageCreate', this.handleMessage.bind(this));
    this.client.on('error', this.handleError.bind(this));
  }

  async handleReady() {
    console.log(`Logged in as ${this.client.user.tag}`);
    
    try {
      await this.client.user.setActivity({
        name: `Prefix: ${prefix}`,
        type: 'PLAYING'
      });
    } catch (error) {
      console.error('Failed to set activity:', error);
    }
  }

  async handleMessage(message) {
    if (message.author.bot) return;
    if (!message.content.toLowerCase().startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = this.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      await message.reply('An error occurred while executing the command.');
    }
  }

  handleError(error) {
    console.error('Discord client error:', error);
  }

  async fetchTwitterUserInfo(username) {
    try {
      const response = await axios.get(`https://twitter.com/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });

      const $ = cheerio.load(response.data);
      
      const errorPage = $('div[class="flex-module error-page clearfix"]').text();
      if (errorPage) {
        throw new Error('User not found');
      }

      return {
        nickname: $(".ProfileHeaderCard-nameLink").text(),
        createdAt: $(".ProfileHeaderCard-joinDate").text().trim(),
        followers: $("#page-container .ProfileNav-item--followers .ProfileNav-value").text(),
        avatarUrl: $(".ProfileAvatar-image").attr("src"),
        likes: $("#page-container .ProfileNav-item--favorites .ProfileNav-value").text(),
        following: $("#page-container .ProfileNav-item--following .ProfileNav-value").text()
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('Failed to fetch Twitter user information');
    }
  }

  createUserEmbed(username, userInfo) {
    return new EmbedBuilder()
      .setAuthor({
        name: `${username}'s Twitter Information`,
        iconURL: userInfo.avatarUrl
      })
      .setThumbnail(userInfo.avatarUrl)
      .setColor('#1DA1F2') // Twitter blue
      .addFields([
        { name: 'Username', value: username, inline: true },
        { name: 'Created At', value: userInfo.createdAt || 'N/A', inline: true },
        { name: 'Nickname', value: userInfo.nickname || 'N/A', inline: true },
        { name: 'Likes', value: userInfo.likes || '0', inline: true },
        { name: 'Followers', value: userInfo.followers || '0', inline: true },
        { name: 'Following', value: userInfo.following || '0', inline: true },
        { name: 'Profile Link', value: `[Click here](https://twitter.com/${username})`, inline: true }
      ])
      .setFooter({ text: 'Twitter Info Bot • ' + new Date().toLocaleDateString() })
      .setTimestamp();
  }

  async handleTwitterCommand(message, args) {
    const username = args[0];
    
    if (!username) {
      await message.reply({
        content: 'Please provide a Twitter username.',
        ephemeral: true
      });
      return;
    }

    // Show typing indicator while processing
    await message.channel.sendTyping();

    try {
      const userInfo = await this.fetchTwitterUserInfo(username);
      const embed = this.createUserEmbed(username, userInfo);
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      const errorMessage = error.message === 'User not found'
        ? `Couldn't find Twitter user: ${username}`
        : 'An error occurred while fetching Twitter information.';
      
      await message.reply({
        content: errorMessage,
        ephemeral: true
      });
    }
  }

  async start() {
    try {
      await this.client.login(token);
    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }
}


// Start the bot
const bot = new TwitterInfoBot();
bot.start().catch(console.error);
