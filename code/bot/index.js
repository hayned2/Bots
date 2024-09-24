const { RefreshingAuthProvider, StaticAuthProvider } = require('@twurple/auth');
const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { PubSubClient } = require('@twurple/pubsub');
const fs = require('fs');
const WebSocket = require('ws');

async function main() {

	// -- AUTHORIZATION + CONNECTION --

	const channelName = "dan_thegamerman"
	const persistentData = JSON.parse(fs.readFileSync('./persistent_data.json'));

	function updatePersistentData() {
		fs.writeFileSync('./persistent_data.json', JSON.stringify(persistentData, null, 4), 'UTF-8');
	};

	// BotTheGamerBot connection
	const chatBotAuthProvider = new RefreshingAuthProvider(
		{
			clientId: persistentData.clientInfo.clientId,
			clientSecret: persistentData.clientInfo.clientSecret,
			onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
				persistentData.botAccessToken = {
					accessToken,
					refreshToken,
					expiryTimestamp: expiryDate === null ? null : expiryDate.getTime() 
				};
				updatePersistentData();
			}
		}
	);
	await chatBotAuthProvider.addUserForToken(persistentData.botAccessToken, ["chat"]);

	// PubSub connection
	const pubSubAuthProvider = new RefreshingAuthProvider(
		{
			clientId: persistentData.clientInfo.clientId,
			clientSecret: persistentData.clientInfo.clientSecret,
			onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
				persistentData.pubSubAccessToken = {
					accessToken,
					refreshToken,
					expiryTimestamp: expiryDate === null ? null : expiryDate.getTime() 
				};
				updatePersistentData();
			}
		}
	);
	await pubSubAuthProvider.addUserForToken(persistentData.pubSubAccessToken);

	// Connect to chat and send a message
	const chatClient = new ChatClient({authProvider: chatBotAuthProvider, channels: [channelName] });
	chatClient.onMessageFailed((_, reason) => console.log(`Message '${message}' failed to send. Reason: '${reason}'`));
	await chatClient.connect();
	setTimeout(() => startup(), 3000);

	async function startup() {
		sendMessage("Hello World, Bot_TheGamerBot is online!");
		startKingOfTheHill();
	}

	// Connect to redemptions through pubsub
	const apiClient = new ApiClient({ authProvider: pubSubAuthProvider });
	const broadcaster = await apiClient.users.getUserByName(channelName);
	const pubSubClient = new PubSubClient({ authProvider: pubSubAuthProvider });

	// -- BROWSER SOURCE SET-UP --

	// Connect to the browser through websockets
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

		ws.onerror = (error) => {
			console.error("An error occurred:", error);
		}

		ws.onclose = () => {
			clearTimeout(pingTimeout);
			console.info("Connection has been closed.");
			connectToWSS();
		}
	}

	connectToWSS();

	// -- CHANNEL POINT REDEMPTION HANDLING --

	const browserRedemptions = {
		"Hello There": "helloThere",
		"Show Me What You Got": "showMeWhatYouGot",
		"You Can Do It!": "youCanDoIt",
		"BootyCheeks": "bootyCheeks",
		"I'm in danger! :)": "imInDanger",
		"Hydrate!": "hydrate",
		"Ah S***, Here We Go Again": "ahShit",
		"Citation": "citation",
		"King of the Hill": "hillTaken",
		"Toasty!": "toasty"
	}

	const numHydrateSoundEffects = 3;
	const numVillagerSoundEffects = 15;

	const _ = await pubSubClient.onRedemption(broadcaster.id, message => {
		if (message.rewardTitle === "King of the Hill") {
			updateKingOfTheHill(message.userDisplayName);
			sendMessage(`${message.userDisplayName} has taken the hill.`);
		}
		else {
			sendMessage(`${message.userDisplayName} just redeemed ${message.rewardTitle} for ${message.rewardCost} channel points!`);
		}
		if (!usersSeenToday.has(message.userName)) {
			userHasAppeared(message.userName, message.userDisplayName);
		}
		if (browserRedemptions.hasOwnProperty(message.rewardTitle)) {

			let alertName = browserRedemptions[message.rewardTitle];
			if (message.rewardName == "Hydrate!") {
				alertName += getRandomInt(numHydrateSoundEffects) + 1;
			} else if (message.rewardName == "Toasty!") {
				const roll = Math.floor(Math.random() * 21);
				console.log(roll);
				if (roll == 1) {
					alertName = "frosty";
				} else if (roll == 2) {
					alertName = "crispy";
				}
			}

			let details = {};
			if (message.message) {
				details = { formatArgs: [ message.message ] };
			}

			ws.send(JSON.stringify({type: "alert", alertName: alertName, details: details}));
		}
	});

	// -- CHAT MESSAGE HANDLING --

	const publicCommands = [
		"!commands",
		"!socials",
		"!twitter",
		"!instagram",
		"!youtube",
		"!discord",
		"!lurk",
		"!quote (number)",
		"!bttv",
		"!gamesbeaten",
		"!attendance",
		"!owned",
		"!koth",
		"!followage"
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
		"celesteSquish",
		"Suavemente",
		"modCheck"
	]

	const twitterLink = "https://x.com/Dan_TheGamerMan";
	const instaLink = "https://www.instagram.com/danleikr";
	const youtubeLink = "https://www.youtube.com/channel/UCg6Fh7wpNNOX_k7tvNCVW2g";
	const discordName = "DanLeikr#7353";
	const gamesLink = "https://docs.google.com/spreadsheets/d/1TAXZvduWWV_pzQrLfpN7plf26v4TsX7QvSXQflySark/edit?usp=sharing";
	var usersSeenToday = new Set();

	async function logUserAppearance(user) {
		appearances = persistentData.userAppearances[user];
		if (appearances === undefined) {
			persistentData.userAppearances[user] = 1;
		} else {
			persistentData.userAppearances[user] += 1;
		}
		updatePersistentData();
	}

	function userHasAppeared(username, userDisplayName) {
		logUserAppearance(username);
		sendMessage("Hello there, " + userDisplayName + ".");
		usersSeenToday.add(username);
		ws.send(JSON.stringify({ type: "alert", alertName: "notify", user: username }));
	}

	function sendMessage(message) {
		chatClient.say(channelName, message);
		console.log(`Bot_TheGamerBot: ` + message);
	}

	function hasThePower(userInfo) {
		return userInfo.isMod || userInfo.isBroadcaster;
	}

	var selfLastSent = false;

	chatClient.onMessage(async (_, user, message, msg) => {
		console.log(msg.userInfo.displayName + ": " + message);
		if (!usersSeenToday.has(user)) {
			userHasAppeared(user, msg.userInfo.displayName);
		}
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
    			sendMessage(`Dan's Socials \nTwitter: ${twitterLink} \nYouTube: ${youtubeLink} \nInstagram: ${instaLink} \nDiscord: ${discordName}`);
    			break;
    		case "!twitter":
    		case "!twatter":
    			sendMessage(`Check out Dan's Twitter here: ${twitterLink}`);
    			break;
    		case "!insta":
    		case "!instagram":
    			sendMessage(`Check out Dan's Instagram here: ${instaLink}`);
    			break;
    		case "!youtube":
    			sendMessage(`Check out Dan's YouTube here: ${youtubeLink}`);
    			break;
    		case "!discord":
    			sendMessage(`Dan's Discord name is ${discordName}`);
    			break;
    		case "!lurk":
    			sendMessage("Thanks for the lurk " + user + "! <3");
    			break;
    		case "!bttv":
				sendMessage(`${bttvEmotes.join(" ")}`);
				break;
			case "!gamesbeaten":
			case "!gameslist":
				sendMessage(`View the list of every game Dan has beaten here: ${gamesLink}`);
				break;
			case "!tierlist":
				sendMessage(`Dan is building up his tierlist here: ${gamesLink}`);
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
				sendMessage("This was Bot_TheGamerBot, signing off!");
				// TODO: kill app.js process
    			process.exit();
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
			case "!attendance":
				sendMessage(`Hi there ${msg.userInfo.displayName}! I have seen you drop by in ${persistentData.userAppearances[user]} different streams!`);
				break;
			case "!kingofthehill":
			case "!koth":
				sendMessage(`You can take over the hill with the King of the Hill channel point redemption. Every 5 minutes, the King is awarded a point. The current king is ${await getCurrentKingOfTheHill()}.`);
				sendMessage(`Current Leaderboard: ${await kingOfTheHillLeaderboard()}`);
				break;
			case "!owned":
			case "!danowned":
				if (await danOwned()) {
					sendMessage(`Dan has been owned ${persistentData.danOwnedCount} times!`);
				} 
				break;
			case "!followage":
				let follow = await followage(msg.userInfo.userId);
				if (follow == null) {
					sendMessage(`${msg.userInfo.displayName}, you're not following Dan (but you probably should be!)`);
				} else {
					sendMessage(`${msg.userInfo.displayName}, you've been following Dan for ${follow}!`);
				}
				break;
		}
		let Hrrrrs = message.match(/Hrrrr/g);
		if (Hrrrrs && Hrrrrs.length > 0) {
			for (let x = 0; x < Hrrrrs.length; x++) {
				ws.send(JSON.stringify({ type: "alert", alertName: "villager" + (getRandomInt(numVillagerSoundEffects) + 1) }));
			}
		}
	});

	// Encouraging viewers to follow
	var reminders = [...persistentData.reminders];
	var sentReminders = [];
	setTimeout(() => setInterval(function() {
	    if (selfLastSent) {
	    	return;
	    };
	    var message = "Hello World!";
		var reminder = getRandomInt(reminders.length);
		message = reminders[reminder];
		sentReminders.push(message);
		reminders.splice(reminder, 1);
		if (reminders.length == 0){
			reminders = [...sentReminders];
			sentReminders = [];
		}
	    
	    sendMessage(message);
	    selfLastSent = true;
	}, 900000), 450000);

	// -- QUOTES --

	function getRandomInt(max){
		return Math.floor(Math.random() * Math.floor(max));
	}

	async function getQuote(quoteNumber) {
		var quotes = persistentData.quotes;
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
		persistentData.quotes.push(quote)
		updatePersistentData();
		getQuote("last");
	}

	// -- KING OF THE HILL --

	async function startKingOfTheHill() {
		setTimeout(() => setInterval(async function() {
			const currentKing = await getCurrentKingOfTheHill();
			if (currentKing === "None" || currentKing === "Dan_TheGamerMan") {
				console.log("The Hill Needs a King");
				return;
			}
			let kingsRecord = persistentData.kingOfTheHill[currentKing];
			if (kingsRecord === undefined) {
				persistentData.kingOfTheHill[currentKing] = 1;
			} else {
				persistentData.kingOfTheHill[currentKing] += 1;
			}
			updatePersistentData();
			console.log("King of the Hill Point Awarded To:", currentKing);
		}, 300000), 300000);
	}

	async function getKingOfTheHillReward() {
		/*
		let response = await apiClient.channelPoints.createCustomReward(broadcaster.id, {
			title: "King of the Hill",
			cost: 500,
			prompt: "Hill Taken By: Nobody",
			is_enabled: true
		});
		*/			

		const rewards = await apiClient.channelPoints.getCustomRewards(broadcaster.id);
		const kothReward = rewards.find(r => r.title === 'King of the Hill');
		return kothReward;
	}

	async function getCurrentKingOfTheHill() {
		let kothReward = await getKingOfTheHillReward();
		let kothRewardPrompt = kothReward.prompt.split(" "); // Note the typo in propmt which is fixed in a later version
		return kothRewardPrompt[kothRewardPrompt.length - 1];
	}

	async function updateKingOfTheHill(newKing) {
		try {

			let kothReward = await getKingOfTheHillReward();

			const response = await apiClient.channelPoints.updateCustomReward(kothReward.broadcasterId, kothReward.id, {
				prompt: `Use !koth for more information. Hill Taken By: ${newKing}`
			});

			console.log(response);
			
		}
		catch (error) {
			console.error("Error:", error);
		}
	}

	async function kingOfTheHillLeaderboard() {
		return Object.entries(persistentData.kingOfTheHill).sort((a, b) => b[1] - a[1]).slice(0, 10).map((entry, index) => {
			const position = index + 1;
			const name = entry[0];
			const score = entry[1];
			return `${position}. ${name}: ${score} points`;
		}).join(' | ');
	}

	async function danOwned() {
		const now = Date.now();
		if (now - persistentData.danOwnedTimestamp > 60000) {
			persistentData.danOwnedCount += 1;
			persistentData.danOwnedTimestamp = now;
			updatePersistentData();
			ws.send(JSON.stringify({ type: "alert", alertName: "danOwned", details: { formatArgs: [persistentData.danOwnedCount] } }));
			return true;
		}
		return false;
	}

	async function followage(userId) {
		try {
			const follow = await broadcaster.getChannelFollower(userId);

			if (follow == null) {
				return null;
			}

			const now = new Date();
		
		// Calculate the years first
		let years = now.getFullYear() - follow.followDate.getFullYear();

		// Check if the current year’s follow date has passed, if not, subtract a year
		if (now.getMonth() < follow.followDate.getMonth() || (now.getMonth() === follow.followDate.getMonth() && now.getDate() < follow.followDate.getDate())) {
			years--;
		}

		// Adjust follow date to the same year as 'now' after calculating full years
		let anniversaryThisYear = new Date(follow.followDate);
		anniversaryThisYear.setFullYear(now.getFullYear());

		if (now < anniversaryThisYear) {
			anniversaryThisYear.setFullYear(now.getFullYear() - 1);
		}

		// Calculate months
		let months = now.getMonth() - anniversaryThisYear.getMonth();
		if (months < 0) {
			months += 12;
		}

		// Calculate the number of days in the previous month to adjust day overflow
		const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // Get the previous month
		let days = now.getDate() - follow.followDate.getDate();

		if (days < 0) {
			months--;
			if (months < 0) {
				years--;
				months = 11;
			}
			days += lastMonth.getDate(); // Add the number of days in the previous month
		}

		// Calculate hours
		const diff = Math.abs(now - follow.followDate);
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

		// Output the duration in years, months, days, and hours
		return `${years} years, ${months} months, ${days} days, and ${hours} hours`;
		
		} catch (error) {
		  console.error('Error fetching follow data:', error);
		  return null;
		}

	}
}

main();