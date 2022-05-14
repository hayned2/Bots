const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');
const { ChatClient } = require('twitch-chat-client');
const fs = require('fs');
const { ApiClient } = require('twitch');
const { PubSubClient, PubSubRedemptionMessage } = require('twitch-pubsub-client');

// print out any errors we didn't expect. We should be doing error handling for all promises, though
process.on("unhandledRejection", (err, promise) => {
	console.error("An unhandled error occured: ", err, promise);
});

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
	setTimeout(() => sendMessage("Hello World, DanLeikrBot is online!"), 3000);

	const apiClient = new ApiClient({ authProvider });
	const pubSubClient = new PubSubClient();
	const userId = await pubSubClient.registerUserListener(apiClient);

	const WebSocket = require('ws');
	let ws = undefined;
	const heartbeat_msg = { type: "heartbeat" };
	const url = "ws://127.0.0.1:8080/";
	let pingTimeout = undefined;

	function heartbeat() {
		clearTimeout(pingTimeout);
		ws.send(JSON.stringify(heartbeat_msg));
		//console.debug("Heartbeat received. Sending back to server.");

		pingTimeout = setTimeout(() => {
			ws.close();
			console.warn("Connection has been terminated, no response from server during heartbeat.");
			connectToWSS();
		}, 30000 + 1000); // +1000 ms buffer for latency
	}

	function connectToWSS() {
		ws = new WebSocket(url);

		ws.onopen = () => {
			console.debug("Handshake established.");
			ws.send(JSON.stringify({ type: 'connection', id: 'bot' }));
		}

		ws.onmessage = (event) => {
			let data = JSON.parse(event.data);
			//console.debug("Data received: ");
			//console.debug(data);

			switch (data.type) {

				case 'heartbeat': {
					heartbeat();
					break;
				}

			}
		}

		ws.onclose = () => {
			clearTimeout(pingTimeout);
			console.info("Connection has been closed.");
			connectToWSS();
		}
	}

	connectToWSS();

	const browserRedemptions = {
		"Hello There": "helloThere",
	}

	const listener = await pubSubClient.onRedemption(userId, message => {
		sendMessage(`${message.userDisplayName} just redeemed ${message.rewardName} for ${message.rewardCost} channel points!`);
		if (browserRedemptions.hasOwnProperty(message.rewardName)) {
				ws.send(JSON.stringify({type: "alert", alertName: browserRedemptions[message.rewardName]}));
		}
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
		"!quote (number)",
		"!bttv",
		"!gamesbeaten"
	];

	const bttvEmotes = [
		"bobPlz",
		"Hrrrr",
		"catJAM",
		"blobDance",
		"monkaS",
		"ThisIsFine",
		"RIP",
		"showMe",
		"hollowParty",
		"foxaPatPat",
		"celesteSquish",
		"Suavemente",
		"modCheck"
	]

	const pollLink = "https://forms.gle/D3yYWGNMedhwcHL5A";
	const twitterLink = "https://twitter.com/DanLeikr";
	const instaLink = "https://www.instagram.com/danleikr";
	const youtubeLink = "https://www.youtube.com/channel/UCg6Fh7wpNNOX_k7tvNCVW2g";
	const discordName = "DanLeikr#7353";
	const charityLink = "";
	const gamesLink = "https://docs.google.com/spreadsheets/d/1TAXZvduWWV_pzQrLfpN7plf26v4TsX7QvSXQflySark/edit?usp=sharing";
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
    			sendMessage("Thanks for the lurk " + user + "! <3");
    			break;
    		case "!poll":
    			if (pollLink.length > 0) {
    				sendMessage("Vote on the next game Dan does a let's play of here: " + pollLink);
    			} else {
    				sendMessage("Dan isn't running a poll for his next game yet, but he will when he starts his next one!");
    			}
    			break;
    		case "!bttv":
				sendMessage(`${bttvEmotes.join(" ")}`);
				break;
			case "!gamesbeaten":
			case "!gameslist":
				sendMessage(`View the list of every game Dan has beaten here: ${gamesLink}`);
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
    		case "!charity":
    		case "!bald":
    		case "!donate":
    			if (charityLink.length == 0) {
    				break;
    			}
				sendMessage("Today's Charity Livestream is to benefit the St. Baldrick's Foundation for Children's Cancer Research. Dan will donate $5 for every subscription during this stream. Or, to donate directly to the campaign visit https://tiltify.com/@danleikr/danleikr-charity-livestream-to-conquer-kids-cancer");
    			break;
    		case "!donated":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			addDonation(message_split[1], false);
    			break;
    		case "!subbed":
    			if (!hasThePower(msg.userInfo)) {
    				break;
    			}
    			addDonation(message_split[1], true);
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
	var selfLastSent = false;

	// Encouraging viewers to follow
	var reminders = [
	    "If you're enjoying the stream, please consider following the channel and showing some support! <3",
	    "Type '!commands' to see a list of the commands DanLeikrBot knows",
	    `Dan uploads all of his let's plays to his YouTube at ${youtubeLink} check it out!`,
	    `Use the !gamesbeaten command to see the list of every game Dan has beaten`,
	    `Follow Dan on Twitter (${twitterLink}) to be updated about streams and uploads PogChamp`,
	    `Check out the BTTV emotes on the channel! ${bttvEmotes.join(" ")}`,
	    "I've heard that following DanLeikr makes you at least marginally cooler Kappa",
	    "Connect with Dan through his socials by using the !socials command SeemsGood"
	];
	var sentReminders = [];
	var reminderDelay = quarterHourMilliseconds * .5;
	var state = 'r';
	setTimeout(() => setInterval(function() {
	    if (selfLastSent) {
	    	return;
	    };
	    var message = "Hello World!";
	    if (state == 'r'){
	    	reminder = getRandomInt(reminders.length);
	    	message = reminders[reminder];
	    	sentReminders.push(message);
	    	reminders.splice(reminder, 1);
	    	if (reminders.length == 0){
	    		reminders = [...sentReminders];
	    		sentReminders = [];
	    	}
	    }
	    else if (state == 'p'){
	    	message = "Vote for Dan's next let's play here! " + pollLink;
	    }
	    else if (state == 'c'){
	    	message = "Today's stream is a charity stream! Donate here! " + charityLink;
	    }
	    
	    sendMessage(message);
	    selfLastSent = true;
	    progressState();
	}, quarterHourMilliseconds), quarterHourMilliseconds * .5);

	function progressState(){
		if (state == 'r'){
			if (pollLink.length > 0){
				state = 'p';
			}
			else if (charityLink.length > 0){
				state = 'c';
			}
			else{
				state = 'r';
			}
		}
		else if (state == 'p'){
			if (charityLink.length > 0){
				state = 'c';
			}
			else {
				state = 'r';
			}
		}
		else if (state == 'c'){
			state = 'r';
		}
	}

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
		if (deaths == 69) {
			sendMessage("Nice Kappa");
		}
	}

	async function addDonation(amount, sub) {
		var currentAmount = await fs.readFileSync('./Donations.txt', 'utf8');
		var currentSubs = await fs.readFileSync('./Subs.txt', 'utf8');
		try {
			currentAmount = parseFloat(currentAmount.split(" ")[1].substring(1));
			currentSubs = parseInt(currentSubs.split(" ")[1]);
			if (sub) {
				currentSubs += parseInt(amount);
				await fs.writeFileSync('./Subs.txt', `Plus ${currentSubs} subs!`)
			} else {
				currentAmount += parseFloat(amount);
				await fs.writeFileSync('./Donations.txt', `Amount: $${currentAmount.toFixed(2)}`)
			}
		} catch(err) {
				sendMessage("Error " + err.message);
		}
		sendMessage(`So far we have donated $${currentAmount.toFixed(2)} plus ${currentSubs} subs each worth 5 dollars to St. Baldrick's Children's Cancer Research!`);
	}
}

main();