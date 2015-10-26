var fs = require('fs');
var timeStarted = Math.floor(new Date() / 1000).toString();
var path = require('path');
var mkdirp = require('mkdirp');
var moment=require("moment");

module.exports=inject;

function inject(serv,settings)
{
  serv.on("error", error => serv.log('[ERR]: Server: '+error.stack));
  serv.on("clientError", (client,error) => serv.log('[ERR]: Client '+client.socket.remoteAddress + ':' + client.socket.remotePort+' : '+error.stack));

  serv.on("listening", port => serv.log('[INFO]: Server listening on port '+port));

  serv.on("banned", (banner,bannedUsername,reason) =>
    serv.log(banner.username + " banned " + bannedUsername + (reason ? " (" + reason + ")" : "")));

  serv.on("seed", (seed) => serv.log("seed: "+seed));

  var logFile=path.join("logs",timeStarted + ".log");

  serv.log = message => {
    message=moment().format('MMMM Do YYYY, HH:mm:ss')+" "+message;
    console.log(message);
    if (!settings.logging) return;
    fs.appendFile(logFile, message + "\n", (err) => {
      if (err) console.log(err);
    });
  };

  serv.createLog = () => {
    if (!settings.logging) return;
    mkdirp("logs", (err) => {
      if(err)
      {
        console.log(err);
        return;
      }

      fs.writeFile(logFile, "[INFO]: Started logging...\n",
        (err) => {
          if (err) console.log(err);
        });
    });
  };
}