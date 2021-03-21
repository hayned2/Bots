let ws = undefined;
const heartbeat_msg = { type: "heartbeat" };
const url = "ws://127.0.0.1:8080/";

function heartbeat() {
    clearTimeout(window.pingTimeout);
    ws.send(JSON.stringify(heartbeat_msg));
    console.log("Heartbeat received. Sending back to server.");

    window.pingTimeout = setTimeout(() => {
        ws.close();
        console.log("Connection has been terminated, no response from server during heartbeat.");
        // is this where I would try to call connectToWSS() again?
    }, 30000 + 1000); // +1000 ms buffer for latency
}

function connectToWSS() {
    ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("Handshake established.");
    }

    ws.onmessage = (event) => {
        let data = JSON.parse(event.data);
        console.log("Data received: ");
        console.log(data);
        
        switch (data.type) {
            
            case 'heartbeat': {
                heartbeat();
                break;
            }

        }
    }

    ws.onerror = (event) => {
        console.log("An error occurred:");
        console.log(event);
    }

    ws.onclose = (event) => {
        clearTimeout(window.pingTimeout);
        console.log("Connection has been closed.");
        console.log(event);

        // try {
            // ws = new WebSocket(url); // retry connecting once
        //     console.log(ws.readyState);
        //     if (ws.readyState == 3) throw "Could not connect to server. Server likely down.";
        // } catch (err) {
        //     console.error(err);
        // }
    }
}

window.onload = connectToWSS();

// TODO: figure out how i want to reconnect on a dropped connection
