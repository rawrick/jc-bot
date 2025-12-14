let repeat = false;

const child = require("child_process").fork("./helpers/hilfe.js");

process.on("message", (msg) => {
  if (msg === "start") {
    repeat = true;
    child.send("start");
  } else {
    repeat = false;
    child.send("stop");
  }
});

child.on("message", (msg) => {
  if (repeat) {
    process.send(msg);
  }
});
