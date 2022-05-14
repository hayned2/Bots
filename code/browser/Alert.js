class Alert {
    #alertInfo = {}
    #alertType = ""
    #htmlElement = undefined;

    constructor(alertName) {
        this.#alertInfo = ALERTS[alertName];
        this.#alertType = this.#alertInfo.type.match(/video|audio/)[0];
    }

    /**
     * Creates a video or audio element and plays it.
     */
    play() {
        this.#htmlElement = document.createElement(this.#alertType);
        this.#htmlElement.src = this.#alertInfo.src;
        this.#htmlElement.type = this.#alertInfo.type;

        let parentElement = document.getElementById(`${this.#alertType}-alert-container`);
        parentElement.className = this.#alertInfo.css[0] + " hidden";

        this.#htmlElement.addEventListener("loadedmetadata", () => {
            parentElement.classList.remove("hidden");
        });

        parentElement.addEventListener("animationend", () => {  // will be ignored for audio alerts
            parentElement.className = "";
            this.#htmlElement.play();
        }, { once: true });

        this.#htmlElement.addEventListener("ended", () => {
            parentElement.className = this.#alertInfo.css[1];
            parentElement.addEventListener("animationend", () => {
                parentElement.className = "hidden";
                setTimeout(playNext, 500, true); // timeout of 500 ms to make sure alert is hidden/done
            }, { once: true });
        }, { once: true });

        this.#htmlElement.load(); // loads metadata & data
        parentElement.appendChild(this.#htmlElement); // add to dom
    }

    /**
     * Deletes the video or audio element from the DOM.
     */
    remove() {
        this.#htmlElement.remove();
    }
}
