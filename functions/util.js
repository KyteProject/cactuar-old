module.exports = (client) => {

  client.keywords = require('./../resources/keywords.json');

  client.verifyUser = async (user) => {
    try {
      const match = /(?:<@!?)?([0-9]{17,20})>?/gi.exec(user);
      if (!match) throw 'Invalid user';
      const id = match[1];
      const check = await client.users.fetch(id);
      if (check.username !== undefined) return check;
    } catch (error) {
      // client.logger.log(error, 'error');
    }
  };

  client.verifyMember = async (guild, member) => {
    try {
      const user = await this.verifyUser(member);
      const target = await guild.fetchMember(user);
      return target;
    } catch (error) {
      throw error;
    }
  };

  client.verifyMessage = async (message, msgid) => {
    try {
      const match = /([0-9]{17,20})/.exec(msgid);
      if (!match) throw 'Invalid message id.';
      const id = match[1];
      const check = await message.channel.messages.fetch(id);
      if (check.cleanContent !== undefined) return id;
    } catch (error) {
      client.logger.log(error, 'error');
    }
  };

  client.verifyChannel = async (message, chanid) => {
    try {
      const match = /([0-9]{17,20})/.exec(chanid);
      if (!match) return message.channel.id;
      const id = match[1];
      const check = await client.channels.resolve(id);
      if (check.name !== undefined && check.type === 'text') return id;
    } catch (error) {
      throw error;
    }
  };

  //Clean text input
  client.clean = async (client, text) => {
    if (text && text.constructor.name == 'Promise')
      text = await text;
    if (typeof evaled !== 'string') text = require('util').inspect(text, { depth: 1 });
    
    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203))
      .replace(client.config.token, 'token? lol');

    return text;
  };

  // Pluralise string
  String.prototype.toPlural = function() {
    return this.replace(/((?:\D|^)1 .+?)s/g, '$1');
  };

  //Randomise Array
  Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)];
  };

  // Capitalises Every Word Like This
  String.prototype.toProperCase = function() {
    return this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  // `await client.wait(1000);` to "pause" for 1 second.
  client.wait = require('util').promisify(setTimeout);
  
  //Error handling
  process.on('uncaughtException', (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
    console.error('Uncaught Exception: ', errorMsg);
    process.exit(1);
  });
    
  process.on('unhandledRejection', err => {
    console.error('Uncaught Promise Error: ', err);
  });
};