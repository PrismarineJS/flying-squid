var fs = require('fs');
var timeStarted = Math.floor(new Date() / 1000).toString();


module.exports=inject;

function inject(serv,settings)
{
  serv.on("error",function(error){
    console.log('[ERR] ', error.stack);
    log('[ERR]: Server:', error.stack);
  });

  serv.on("listening",function(port){
    console.log('[INFO]: Server listening on port', port);
    log('[INFO]: Server listening on port', port);
  });


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

  serv.log=log;
  serv.createLog=createLog;
}