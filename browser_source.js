let ws = undefined;
const heartbeat_msg = { type: "heartbeat" };
const url = "ws://127.0.0.1:8080/";

let alertQueue = [];
let alertsPlaying = false;

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
        console.debug("Data received: ");
        console.debug(data);

        switch (data.type) {

            case 'heartbeat': {
                heartbeat();
                break;
            }

            case 'alert': {
                alertQueue.push(data.alertName);
                playAlert();
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

// a function that will run alerts until queue is empty
function playAlert(embedded = false) {
    // if the queue has more than the one alert we just pushed, then 
    // it should already be playing the alerts
    if (alertsPlaying && !embedded) return;
    console.log(alertQueue);

    alertsPlaying = true;
    let toPlay = alerts[alertQueue.shift()];
    let vid = document.getElementById("vid-alert");

    vid.src = toPlay.src;
    vid.type = toPlay.type;
    vid.parentElement.className = toPlay.css[0] + " hidden";
    // css[0] => show alert styles
    // css[1] => hide alert styles

    vid.parentElement.addEventListener("animationend", () => {
        console.log("animation ended");
        vid.parentElement.className = "";
        vid.play();
    }, { once: true });

    vid.onended = function () {
        vid.parentElement.className = toPlay.css[1];
        vid.parentElement.addEventListener("animationend", () => {
            vid.parentElement.className = "hidden";
            if (alertQueue.length > 0) setTimeout(playAlert, 500, true); // timeout of 500 ms to make sure video is hidden
            else alertsPlaying = false;
        }, { once: true });
    }

    vid.parentElement.classList.remove("hidden");
}
