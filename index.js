const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');
const { ChatClient } = require('twitch-chat-client');
const fs = require('fs');
const { ApiClient } = require('twitch');
const { PubSubClient, PubSubRedemptionMessage } = require('twitch-pubsub-client');

async function main() {
	const channelName = "#danleikr"
	const clientInfo = JSON.parse(await fs.readFileSync('./clientInfo.json'));
	const tokenData = JSON.parse(await fs.readFileSync('./tokens.json'));
	const authProviderChat = new RefreshableAuthProvider(
		new StaticAuthProvider(clientInfo.clientId, tokenData.accessToken),
		{
			clientSecret: clientInfo.clientSecret,
			refreshToken: tokenData.refreshToken,
			expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
			onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
				const newTokenData = {
					accessToken,
					refreshToken,
					expiryTimestamp: expiryDate === null ? null : expiryDate.getTime() 
				};
				await fs.writeFileSync('./tokens.json', JSON.stringify(newTokenData, null, 4), 'UTF-8');
			}
		}
	);

	const dlTokenData = JSON.parse(await fs.readFileSync('./dltokens.json'));
	const authProvider = new RefreshableAuthProvider(
		new StaticAuthProvider(clientInfo.clientId, dlTokenData.accessToken),
		{
			clientSecret: clientInfo.clientSecret,
			refreshToken:dlTokenData.refreshToken,
			expiry: dlTokenData.expiryTimestamp === null ? null : new Date(dlTokenData.expiryTimestamp),
			onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
				const newTokenData = {
					accessToken,
					refreshToken,
					expiryTimestamp: expiryDate === null ? null : expiryDate.getTime() 
				};
				await fs.writeFileSync('./dltokens.json', JSON.stringify(newTokenData, null, 4), 'UTF-8');
			}
		}
	);

	const chatClient = new ChatClient(authProviderChat, { channels: ['danleikr'] });
	chatClient.onMessageFailed((channel, reason) => console.log(`Message '${message}' failed to send. Reason: '${reason}'`));

	await chatClient.connect();
	setTimeout(() => sendMessage("Hello World, DanLeikrBot is online!"), 1000);

	const apiClient = new ApiClient({ authProvider });
	const pubSubClient = new PubSubClient();
	const userId = await pubSubClient.registerUserListener(apiClient);
	const listener = await pubSubClient.onRedemption(userId, message => {
		sendMessage(`${message.userDisplayName} just redeemed ${message.rewardName} for ${message.rewardCost} channel points!`);
	});

	const publicCommands = [
		"!commands",
		"!socials",
		"!twitter",
		"!instagram",
		"!youtube",
		"!discord",
		"!lurk",
		"!poll",
		"!quote (number)"
	];

	const modCommands = [
		"!so",
		"!saygoodbye"
	]

	const hiddenCommands = [
		"!heh",
		"!insta"
	]

	const pollLink = "";
	const twitterLink = "https://twitter.com/DanLeikr";
	const instaLink = "https://www.instagram.com/danleikr";
	const youtubeLink = "https://www.youtube.com/channel/UCg6Fh7wpNNOX_k7tvNCVW2g";
	const discordName = "DanLeikr#7353";
	var deaths = -1;

	chatClient.onMessage((channel, user, message, msg) => {
		console.log(user + ": " + message);
		selfLastSent = false;
    	var message_split = message.match(/\S+/g);
    	var command = message_split[0].toLowerCase();
    	switch (command) {
    		case "!heh":
    			sendMessage("kek");
    			break;
    		case "!commands":
    			sendMessage(`List of available commands: ${publicCommands.join(", ")}`);
    			break;
    		case "!socials":
    			sendMessage(`DanLeikr's Socials \nTwitter: ${twitterLink} \nYouTube: ${youtubeLink} \nInstagram: ${instaLink} \nDiscord: ${discordName}`);
    			break;
    		case "!twitter":
    		case "!twatter":
    			sendMessage(`Check out DanLeikr's Twitter here: ${twitterLink}`);
    			break;
    		case "!insta":
    		case "!instagram":
    			sendMessage(`Check out DanLeikr's Instagram here: ${instaLink}`);
    			break;
    		case "!youtube":
    			sendMessage(`Check out DanLeikr's YouTube here: ${youtubeLink}`);
    			break;
    		case "!discord":
    			sendMessage(`DanLeikr's Discord name is ${discordName}`);
    			break;
    		case "!lurk":
    			sendMessage("Thanks for the lurk " + user + "! Enjoy creeping around in the shadowy corner :)");
    			break;
    		case "!poll":
    			if (pollLink.length > 0) {
    				sendMessage("Vote on the next game Dan does a let's play of here: " + pollLink);
    			} else {
    				sendMessage("Dan isn't running a poll for his next game yet, but he will when he starts his next one!");
    			}
    			break;
    		case "!so":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			var recipient = message_split[1];
    			recipient = recipient.replace("@", "");
    			sendMessage(`Shoutout to ${recipient}! Go send them some love and support over at twitch.tv/${recipient.toLowerCase()} TwitchLit CurseLit TwitchLit CurseLit`);
    			break;
    		case "!saygoodbye":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			sendMessage("This is DanLeikrBot, signing off!");
    			process.exit();
    			break;
    		case "!goal":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			changeCurrentGoal(message_split.slice(1).join(" "));
    			break;
    		case "!quote":
    		case "!quotes":
    			var quoteNumber = null;
    			if (message_split.length > 1 && !isNaN(message_split[1])) {
    				quoteNumber = parseInt(message_split[1]) - 1;
    			}
    			getQuote(quoteNumber);
    			break;
    		case "!addquote":
    		case "!setquote":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			setQuote(message_split.slice(1).join(" "));
    			break;
    		case "!adddeath":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			addDeath();
    			break;
    		case "!setdeaths":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			setDeaths(message_split[1]);
    			break;
    	}	
	});

	function sendMessage(message) {
		chatClient.say(channelName, message);
		console.log(`DanLeikrBot: ` + message);
	}

	function hasThePower(userInfo) {
		return userInfo.isMod || userInfo.isBroadcaster;
	}

	const quarterHourMilliseconds = 900000;
	var selfLastSent = true;

	// Encouraging viewers to follow
	var reminders = [
	    "If you're enjoying the stream, please consider following the channel and showing some support! <3",
	    "Type '!command' to see a list of the commands DanLeikrBot knows",
	    "Don't forget to follow the channel if you're having fun :)",
	    `Follow Dan on Twitter (${twitterLink}) to be updated about streams and uploads PogChamp`,
	    "I've heard that following DanLeikr makes you at least marginally cooler Kappa",
	    "Connect with Dan through his socials by using the !socials command SeemsGood"
	];
	var reminderCounter = 0;
	var reminderDelay = 0;
	setTimeout(() => setInterval(function() {
	    if (selfLastSent) {
	    	return;
	    }
	    sendMessage(reminders[reminderCounter % reminders.length]);
	    selfLastSent = true;
	    reminderCounter += 1;
	}, quarterHourMilliseconds * 1.5), reminderDelay);

	// Next game poll
	var nextGameDelay = quarterHourMilliseconds * 1.25;
	setTimeout(() => setInterval(function() {
	    if (selfLastSent || pollLink.length == 0) {
	    	return;
	    }
	    sendMessage("Which game should be Dan's next let's play? Vote now! " + pollLink);
	    selfLastSent = true;
	}, quarterHourMilliseconds * 2), nextGameDelay);

	async function changeCurrentGoal(goal) {
		fs.writeFileSync('./Current Goal.txt', `Current Goal:\n${goal}`);
	 	sendMessage("Current Goal has been updated to: " + goal);
	}

	function getRandomInt(max){
		return Math.floor(Math.random() * Math.floor(max));
	}

	async function getQuote(quoteNumber) {
		var quotes = await fs.readFileSync('./Quotes.txt', "utf8").split(/\r?\n/);
		if (quoteNumber == null) {
			quoteNumber = getRandomInt(quotes.length);
		} 
		else if (quoteNumber == "last") {
			quoteNumber = quotes.length - 1;
		}
		else if (quoteNumber < 0 || quoteNumber >= quotes.length) {
			sendMessage(`Error - Choose a quote number between 1 and ${quotes.length}`);
			return;
		}
		sendMessage(`Quote #${quoteNumber + 1}: ${quotes[quoteNumber]}`);
	}

	async function setQuote(quote) {
		if (quote.replace(/\s+/g, '').length == 0) {
			sendMessage("Silence is golden, but make sure you include a quote to be added next time ;)");
			return;
		}
		await fs.appendFileSync('./Quotes.txt', '\n' + quote);
		getQuote("last");
	}

	async function addDeath() {
		var deaths = await fs.readFileSync('./Deaths.txt', 'utf8');
		try {
			deaths = parseInt(deaths.split(" ")[1]) + 1;
		} catch {
			deaths = 1;
		}
		setDeaths(deaths);
	}

	async function setDeaths(deaths) {
		await fs.writeFileSync('./Deaths.txt', `Deaths: ${deaths}`);
		//sendMessage("Death count updated RIP");
		if (deaths == 69) {
			sendMessage("Nice Kappa");
		}
	}
}

main();