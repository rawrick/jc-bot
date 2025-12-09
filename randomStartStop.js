var repeat = false;

const cp = require('child_process');
var child = cp.fork('./hilfe.js');


process.on('message', message => {
  if(message === 'start'){
    repeat = true;
    console.log(message);
    child.send(message);
  }
  else{
    repeat = false;
  }
});

child.on('message', message =>{
  if(repeat === true){
    process.send(message);
  };
})
