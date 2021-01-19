const tmi = require('tmi.js');
const fs = require('fs');

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

client.on('message', (channel, tags, message, self) => {
	if (self) return;
	switch(message.toLowerCase()) {
		case '!heh':
			client.say(channel, 'kek');
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
	}
});