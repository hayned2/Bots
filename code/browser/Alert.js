class Alert {
    #data = {}
    #alertInfo = {}
    #alertType = ""
    #htmlElement = undefined;
    #user = ""

    constructor(data) {
        this.#data = data;
        this.#alertInfo = ALERTS[data.alertName];
        this.#alertType = this.#alertInfo.type.match(/video|audio/)[0];
        this.#user = data.user;
    }

    /**
     * Creates a video or audio element and plays it.
     */
    play() {
        // create div that will hold everything
        this.#htmlElement = document.createElement("div");
        // only add ID's to alerts that can be queued
        if (this.#alertInfo.queued) this.#htmlElement.id = this.#data.alertName;

        // create audio/video element
        let alert = document.createElement(this.#alertType);

        if (this.#data.alertName == "notify") {
            alert.src = this.#alertInfo[`src_${this.#user}`] ?? this.#alertInfo.src;
        } else {
            alert.src = this.#alertInfo.src;
        }
        alert.type = this.#alertInfo.type;

        // some alerts have additional html required. create any additional elements
        let elems = [];
        if (this.#alertInfo.img) {
            let img = document.createElement("img");
            img.src = this.#alertInfo.img;
            img.alt = "";
            elems.push(img);
        }

        if (this.#alertInfo.elems) {
            // create each element
            for (let [elemType, data] of Object.entries(this.#alertInfo.elems)) {
                let elem = document.createElement(elemType);
                // set the element attributes
                for (let [attr, val] of Object.entries(data)) {
                    let attr_val = val;
                    if (attr_val.includes("{") ) {
                        attr_val = formatString(attr_val, ...getKey(this.#data, "details.formatArgs"));
                    }
                    elem[attr] = attr_val;
                }
                elems.push(elem);
            }
        }

        // set starting css and hide the element
        this.#htmlElement.className = this.#alertInfo.css[0] + " hidden";

        // add listeners for loading metadata, when starting animation ends (for videos), & when audio/video ends
        alert.addEventListener("loadedmetadata", () => {
            this.#htmlElement.classList.remove("hidden");
        });

        if (this.#alertType === "video") {
            this.#htmlElement.addEventListener("animationend", () => {
                this.#htmlElement.className = "";
                alert.play();
            }, { once: true });
        }

        alert.addEventListener("ended", () => {
            this.#htmlElement.className = this.#alertInfo.css[1] || this.#htmlElement.className;
            if (this.#alertType === "audio" && !this.#alertInfo.img) {
                if (this.#alertInfo.queued) setTimeout(playNext, 500, true);    // plays next in queue
                this.#htmlElement.remove();
            }
            // for images that play a sound effect, let it run for its specified allotted time
            else if (this.#alertType === "audio" && this.#alertInfo.img && this.#alertInfo.timeSpan) {
                setTimeout(() => {
                    if (this.#alertInfo.queued) setTimeout(playNext, 500, true);
                    this.#htmlElement.remove();
                }, this.#alertInfo.timeSpan);
            }
            // all video alerts and some audio alerts have ending animations
            else {
                this.#htmlElement.addEventListener("animationend", () => {
                    this.#htmlElement.className = "hidden";
                    setTimeout(playNext, 500, true); // timeout of 500 ms to make sure alert is hidden/done
                }, { once: true });
            }
        }, { once: true });

        alert.load(); // loads metadata & data

        // add all elements to div
        this.#htmlElement.appendChild(alert);
        if (elems.length) this.#htmlElement.append(...elems);

        document.getElementById(`${this.#alertType}-alert-container`).appendChild(this.#htmlElement); // add to dom
        if (this.#alertType === "audio") {
            alert.play();
        }
    }

    /**
     * Deletes the video or audio element from the DOM.
     */
    remove() {
        this.#htmlElement.remove();
    }
}
