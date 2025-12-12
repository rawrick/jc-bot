let active = false;

function loop() {
    if (!active) return;

    process.send("randomSound");

    const delay = 1000 * random(5, 300);
    setTimeout(loop, delay);
}

function random(low, high) {
  return Math.random() * (high - low) + low;
}

process.on("message", (msg) => {
    if (msg === "start") {
        active = true;
        loop();
    } else if (msg === "stop") {
        active = false;
    }
});
