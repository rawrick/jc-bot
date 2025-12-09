function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function random(low, high) {
  return Math.random() * (high - low) + low;
}

process.on('message', message => {
  while(message === 'start'){
    process.send('randomSound');
    wait(1000*random(5, 300));
  };
})
