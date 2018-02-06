const { version } = require('discord.js');
const moment = require('moment');
require('moment-duration-format');

exports.run = async (client, message, args, level) => {
  const duration = moment.duration(client.uptime).format(' D [days], H [hrs], m [mins], s [secs]');

  message.channel.send(`= STATISTICS =\n
• Mem Usage  :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Uptime     :: ${duration}
• Users      :: ${client.users.size.toLocaleString()}
• Servers    :: ${client.guilds.size.toLocaleString()}
• Channels   :: ${client.channels.size.toLocaleString()}
• Commands   :: ${client.commands.size.toLocaleString()}
• Discord.js :: v${version}
• Node       :: ${process.version}
• Bot        :: v${client.config.version}`, {code: 'asciidoc'});
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['bs'],
  permLevel: 'User',
  botPerms: []
};

exports.help = {
  name: 'botstat',
  category: 'System',
  description: 'Provides statistics on the bot',
  extended: '',
  usage: 'botstat'
};
