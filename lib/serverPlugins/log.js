module.exports=inject;

var fs = require('fs');
var timeStarted = Math.floor(new Date() / 1000).toString();

function inject(serv,settings) {

  serv.log=log;
  serv.createLog=createLog;

  function log(message) {
    if (settings.logging == true) {
      fs.appendFile("logs/" + timeStarted + ".log", message + "\n", function (err) {
      });
    }
  }


  function createLog() {
    fs.writeFile("logs/" + timeStarted + ".log", "[INFO]: Started logging...\n", function (err, data) {
      if (err) return console.log(err);
    });
  }
}
