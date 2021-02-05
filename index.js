const tmi = require('tmi.js');
const fs = require('fs');
const fetch = require('node-fetch');

let content = undefined;
try {
	content = fs.readFileSync("bot_login.txt");
	content = content.toString().split("\n");
} catch (err) {
	process.exit("Could not read login info. Please try again.")
}

const client = new tmi.client({
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: content[0],
		password: content[1]
	},
	channels: ['danleikr']

});

client.connect();

client.on('join', (channel, username, isSelf) => {
	if (isSelf) {
		client.say('danleikr', "Hello world! DanLeikrBot is here!").catch(err =>console.log(err));
	}
});

var publicCommands = [
	"!commands",
	"!twitter",
	"!instagram",
	"!youtube",
	"!discord",
	"!lurk",
	"!poll"
]

var modCommands = [
	"!so",
	"!saygoodbye"
]

client.on('message', (channel, tags, message, self) => {
	if (self) return;
	var message_split = message.match(/\S+/g);
	var command = message_split[0].toLowerCase();
	var hasPermissions = hasThePower(tags);
	if (!publicCommands.concat(modCommands).includes(command)) {
		return;
	}
	switch(command) {
		case '!heh':
			client.say(channel, 'kek');
			break;
		case '!commands':
			client.say(channel, `List of available commands: ${publicCommands.join(", ")}`);
			break;
		case '!twitter':
			client.say(channel, "Check out DanLeikr's Twitter here: https://twitter.com/DanLeikr");
			break;
		case '!insta':
		case '!instagram':
			client.say(channel, "Check out DanLeikr's Instagram here: https://www.instagram.com/danleikr");
			break;
		case '!youtube':
			client.say(channel, "Check out DanLeikr's YouTube here: https://www.youtube.com/channel/UCg6Fh7wpNNOX_k7tvNCVW2g");
			break;
		case '!discord':
			client.say(channel, "DanLeikr's Discord name is DanLeikr#7353");
			break;
		/*case '!donate':
			client.say(channel, "Donations can be sent here: https://streamlabs.com/danleikr");
			break;*/
		case '!lurk':
			client.say(channel, "Pay no attention to that " + tags['display-name'] + " behind the curtain!");
			break;
		case '!poll':
			client.say(channel, "Vote on the next game Dan does a playthrough of here: https://twitter.com/DanLeikr/status/1348784546771304450");
			break;
		case '!so':
			if (!hasPermissions) {
				break;
			}
			var recipient = message_split[1];
			if (recipient[0] == '@') {
				recipient = recipient.substring(1);
			}
			client.say(channel, `Shoutout to ${recipient}! Go send them some love and support over at twitch.tv/${recipient.toLowerCase()} TwitchLit CurseLit TwitchLit CurseLit`);
			break;
		case '!saygoodbye':
			if (!hasPermissions) {
				break;
			}
			client.say(channel, 'This is DanLeikrBot, signing off!');
			process.exit();
			break;
	}
});

function hasThePower(tags) {
	return tags['mod'] || tags['username'] == 'danleikr';
}