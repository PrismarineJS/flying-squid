var fs = require('fs');
var timeStarted = Math.floor(new Date() / 1000).toString();
var path = require('path');
var mkdirp = require('mkdirp');
var moment=require("moment");

module.exports=inject;

function inject(serv,settings)
{
  serv.on("error",function(error){
    log('[ERR]: Server: '+error.stack);
  });

  serv.on("listening",function(port){
    log('[INFO]: Server listening on port '+port);
  });

  serv.on("banned",function(banner,bannedUsername,reason){
    serv.log(banner.username + " banned " + bannedUsername + (reason ? " (" + reason + ")" : ""));
  });

  var logFile=path.join("logs",timeStarted + ".log");

  function log(message) {
    message=moment().format('MMMM Do YYYY, hh:mm:ss')+" "+message;
    console.log(message);
    if (!settings.logging) return;
    fs.appendFile(logFile, message + "\n",function(err){
      if (err) console.log(err);
    });
  }

  function createLog() {
    if (!settings.logging) return;
    mkdirp("logs", function(err) {
      if(err)
      {
        console.log(err);
        return;
      }

      fs.writeFile(logFile, "[INFO]: Started logging...\n",
        function (err) {
          if (err) console.log(err);
        });
    });
  }

  serv.log=log;
  serv.createLog=createLog;
}