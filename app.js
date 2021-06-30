const WebSocket = require("ws");

let client = undefined;
let twitchBot = undefined;
const heartbeat_msg = { type: "heartbeat" };

const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log("WebSocket server successfully started on port 8080");
});

function heartbeat(ws) {
    ws.isAlive = true;
    console.log("Heartbeat received.");
}

const checkConnection = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            console.log("No reply from heartbeat. Terminating connection.");
            return ws.terminate(); // terminate dead connections
        }

        ws.isAlive = false;
        ws.send(JSON.stringify(heartbeat_msg));
        console.log("Sending heartbeat to client.");
    });
}, 30000); // check every 30 seconds whether connection is still alive

// when the handshake is complete
wss.on("connection", (ws, req) => {
    ws.isAlive = true;
    console.log("Handshake established.");

    ws.on("message", (data) => {
        console.log("Data received:")
        console.log(data);

        data = JSON.parse(data);
        switch (data.type) {

            case 'connection': {
                if (data.id === "browser") client = ws;
                else if (data.id === "bot") twitchBot = ws;
            }

            case 'heartbeat': {
                heartbeat(ws);
                break;
            }
            
            // send all alerts to the client
            case 'alert': {
                client.send(JSON.stringify(data));
                break;
            }

        }
    });

    ws.on("open", () => {
        ws.send("Connection received.");
    });

    ws.on("close", (code, reason) => {
        console.log("Connection closed.")
        console.log(code, reason);
    });

});

wss.on('error', (err) => {
    console.log("An error has ocurred:");
    console.log(err);
});

wss.on("close", () => {
    clearInterval(checkConnection);
});

// notes:
// - we might be able to close the websocket server with the !goodbye command 
// the bot has. we just have to call server.close(callback) and have an if 
// statement that checks whether the message says "goodbye" (or some variant. 
// we don't want to accidentally kill the server before the stream is actually over)

// to make testing easier, this will allow asynchronous input from the 
// console so that I can send test alerts
process.stdin.on('data', (data) => {
    let testAlert = "helloThere";
    data = data.toString().trim();
    switch (data) {

        case "test alert": {
            client.send(JSON.stringify({ type: "alert", alertName: testAlert }));
        }
    }
});
