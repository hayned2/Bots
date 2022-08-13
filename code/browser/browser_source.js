let ws = undefined;
const heartbeat_msg = { type: "heartbeat" };
const url = "ws://127.0.0.1:8080/";

let isPlaying = false;
let queue = [];
let currentlyLoaded = undefined;


function heartbeat() {
    clearTimeout(window.pingTimeout);
    ws.send(JSON.stringify(heartbeat_msg));
    console.debug("Heartbeat received. Sending back to server.");

    window.pingTimeout = setTimeout(() => {
        ws.close();
        console.warn("Connection has been terminated, no response from server during heartbeat.");
        connectToWSS();
    }, 30000 + 1000); // +1000 ms buffer for latency
}

function connectToWSS() {
    ws = new WebSocket(url);

    ws.onopen = () => {
        console.debug("Handshake established.");
        ws.send(JSON.stringify({ type: 'connection', id: 'browser' }));
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

            case 'alert': {
                if (ALERTS[data.alertName] === undefined) return;

                let alert = new Alert(data);

                // adds to queue if this is an alert that should be queued
                if (ALERTS[data.alertName].queued) {
                    queue.push(alert);
                    playNext();
                }
                // otherwise, plays immediately
                else playNow(alert);

                break;
            }

        }
    }

    ws.onerror = (event) => {
        console.error("An error occurred:");
        console.error(event);
    }

    ws.onclose = () => {
        clearTimeout(window.pingTimeout);
        console.info("Connection has been closed.");
        connectToWSS();
    }
}

function playNext(donePlaying = false) {
    if (donePlaying) isPlaying = false;
    if (isPlaying) return;

    if (currentlyLoaded && !isPlaying) currentlyLoaded.remove();  // remove alert from dom

    currentlyLoaded = queue.shift();

    if (currentlyLoaded === undefined) return; // queue is empty

    isPlaying = true;
    currentlyLoaded.play();
}

function playNow(alert) {
    setTimeout(play, randomDelay(), alert);

    function play(alert) {
        alert.play();
    }
}

/**
 * Generates random delay between 0 - 1 seconds.
 * 
 * @returns a random float between 0 and 1
 */
function randomDelay() {
    return Math.floor(Math.random() * 2000);
}

/**
 * Finds the value associated with a specified key. Key must be given as a dot notation path.
 * 
 * EX: 
 *      obj  = { alertname: "helloThere", details: { text: "this is an example" } }
 *      path = "details.text"   -->     "this is an example"
 *      path = "alertname"      -->     "helloThere"
 *      path = "details"        -->     { text: "this is an example" }
 * 
 * @param {object} obj the object to search
 * @param {string} path the dot notation path of the key to find
 * @returns the value associated to the key
 */
function getKey(obj, path) {
    return path.split('.').reduce((val, el) => val[el], obj);
}
