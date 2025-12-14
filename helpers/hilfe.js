let active = false;
let timer = null;

// Loop that sends "randomSound" at random intervals
function scheduleNext() {
    if (!active) return;

    const delay = randomMs(5000, 300000);
    timer = setTimeout(() => {
        if (!active) return;
        process.send("randomSound");
        scheduleNext();
    }, delay);
}

// Returns a random number of milliseconds between min and max
function randomMs(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

process.on("message", (msg) => {
    if (msg === "start") {
        if (!active) {
            active = true;
            scheduleNext();
        }
    } else if (msg === "stop") {
        active = false;
        if (timer) clearTimeout(timer);
        timer = null;
    }
});
