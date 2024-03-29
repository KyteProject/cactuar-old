const { MessageEmbed } = require('discord.js');

module.exports = async client => {
	client.feedbackScoring = async message => {
		const regex = /\s+/gi;
		const multipier = client.permlevel(message) >= 5 ? 1.2 : 1;
		message.wordCount = message.argsJoined
			.trim()
			.replace(regex, ' ')
			.split(' ').length;
		message.charCountNoSpace = message.argsJoined.replace(regex, '').length;
		client.countKeywords(message);
		message.score = Math.round(
			(message.wordCount * 0.2 + message.charCountNoSpace / 100 + message.keywordCount * 9) * multipier
		);
		message.tokenGain = message.score >= 300 && message.settings.enableTokens === 1 ? 1 : 0;
		client.logger.log(`Debug: ${message.score}`);
		client.query.feedbackSubmit(client, message);
	};

	client.nextLevel = async (message, level) => {
		const nextLevel = level + 1;
		const pointsToLevel = 1 / 4 * Math.floor(nextLevel - 1 + 300 * Math.pow(2, (nextLevel - 1) / 7));
		message.nextLevel = Math.floor(pointsToLevel);
	};

	client.levelUp = async (message, row) => {
		message.currentPoints = row.currentPoints + message.score;
		message.totalPoints = row.totalPoints + message.score;
		message.tokens = row.tokens + message.tokenGain;
		message.keywordCount += row.keywordCount;
		message.timesGiven = row.timesGiven + 1;

		if (row.keywordCount < 5 && message.keywordCount >= 5) {
			message.reply('You can now request feedback! <:cactuar:537604635687518245>');
		}

		if (message.currentPoints >= row.nextLevel) {
			message.currentPoints = 0;
			message.level = row.level + 1;
			client.nextLevel(message, message.level);
			message.nextLevel += row.nextLevel;
			message.channel.send(`${message.author.username} just reached level ${message.level}! 🎵`);
		} else {
			message.level = row.level;
			message.nextLevel = row.nextLevel;
		}
	};

	client.countKeywords = async message => {
		message.keywordCount = 0;
		for (let i = 0; i < client.keywords.length; i++) {
			if (message.argsJoined.includes(client.keywords[i])) {
				message.keywordCount++;
			}
		}
	};

	client.checkFeedback = async message => {
		const fileRegex = /\.(mp3|wav|wma|flac|ogg|m4a|mp4|m4b|aac)/gim;
		let ret = false;

		for (let i = 0; i < client.urls.length; i++) {
			if (message.cleanContent.includes(client.urls[i])) {
				ret = true;
			}
		}

		if (message.attachments.size) {
			message.attachments.each(file => {
				if (fileRegex.exec(file.name) !== null) {
					ret = true;
				}
			});
		}

		return ret;
	};

	client.feedbackPermission = async (message, row) => {
		message.tokens = row.tokens;

		if (row.keywordCount < 5 && row.tokens === 0) {
			if (message.settings.deleteSwitch) message.delete();
			if (message.settings.botLogEnable) client.feedbackMsg(message, row);
			client.logger.log(`[Sys] Feedback denied for: ${message.author.username}`);
		} else if (row.keywordCount < 5 && row.tokens > 0) {
			if (message.settings.enableTokens === 1) {
				if (message.settings.pinMessage) {
					try {
						const match = /([0-9]{17,20})/.exec(message.settings.messageID);
						if (!match) throw 'Invalid message id.';
						const id = match[1];
						const oldMsg = await message.channel.messages.fetch(id);
						if (oldMsg.cleanContent !== undefined) {
							oldMsg.unpin();
							message.pin();
						}
					} catch (error) {
						message.pin();
						client.logger.log(error, 'error');
					}
				}
			}
			message.timesRequested = row.timesRequested + 1;
			message.tokens = row.tokens - 1;
			client.query.updateUser(client, message, 'request');
			message.react('537604635687518245');
		} else {
			if (message.settings.pinMessage) {
				try {
					const match = /([0-9]{17,20})/.exec(message.settings.messageID);
					if (!match) throw 'Invalid message id.';
					const id = match[1];
					const oldMsg = await message.channel.messages.fetch(id);
					if (oldMsg.cleanContent !== undefined) {
						oldMsg.unpin();
						message.pin();
					}
				} catch (error) {
					message.pin();
					client.logger.log(error, 'error');
				}
			}
			message.timesRequested = row.timesRequested + 1;
			client.query.updateUser(client, message, 'request');
			message.react('537604635687518245');
		}
	};

	client.feedbackMsg = async (message, row, type) => {
		try {
			const match = /([0-9]{17,20})/.exec(message.settings.messageID);
			if (!match) throw 'Invalid message id.';
			const id = match[1];
			const oldMsg = await message.channel.messages.fetch(id);
			let embed = new MessageEmbed();

			if (oldMsg.cleanContent !== undefined) {
				if (oldMsg.attachments.size > 0) {
					let files = [];

					oldMsg.attachments.each(file => {
						files.push(file);
					});

					embed.setDescription(oldMsg.cleanContent);

					embed.attachFiles(files);
				}

				if (oldMsg.embeds.length > 0) {
					embed = oldMsg.embeds[0];
				}

				if (oldMsg.embeds.length === 0 && oldMsg.attachments.size === 0) {
					embed.setDescription(oldMsg.cleanContent);
				}

				embed
					.setAuthor('Last Request:', client.user.avatarURL())
					.setColor('00d919')
					.setTimestamp(oldMsg.createdAt)
					.setFooter(oldMsg.author.username, oldMsg.author.avatarURL());

				if (type !== 'command') {
					return message.reply(`❌ **Feedback Denied!** ❌\n${message.settings.response}`, embed);
				}

				return message.channel.send(embed);
			}
		} catch (error) {
			client.logger.log(error, 'error');
			message.channel.send(
				'Feedback has been denied! The previous request message cannot be found, try scrolling up and finding some older tracks to give feedback to 😄'
			);
		}
	};
};
