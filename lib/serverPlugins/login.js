var path = require('path');
var requireIndex = require('requireindex');
var playerPlugins = requireIndex(path.join(__dirname,'..', 'playerPlugins'));
var Player=require("../player");
var moment=require("moment");
var request=require("request");

module.exports = inject;

function inject(serv,options)
{
  serv._server.on('login', function (client) {
    var player=new Player();
    player._client=client;
    for(var pluginName in playerPlugins) {
      playerPlugins[pluginName](serv, player, options);
    }
    serv.emit("newPlayer",player);
    player.login();
  });
  
  function ban(uuid, reason) {
    serv.bannedPlayers[uuid] = {
      time: +moment(),
      reason: reason || "You are banned!"
    };
  }
  
  function getUUIDFromUsername(username, cb) {
    request('https://api.mojang.com/users/profiles/minecraft/' + username, function(err, res, body) {
        cb(body ? JSON.parse(body).id : null);
    });
  }
  
  function banUsername(username, reason, cb) {
    serv.getUUIDFromUsername(username, function(uuid) {
      if (!uuid) return cb ? cb(false) : false;
      serv.ban(uuid, reason);
      if (cb) cb(true);
    });
  }
  
  function pardonUsername(username, cb) {
    serv.getUUIDFromUsername(username, function(uuid) {
      if (!cb) return;
      if (!uuid) return cb(false);
      else return cb(pardon(uuid));
    });
  }
  
  function pardon(uuid) {
    if (serv.bannedPlayers[uuid]) {
      delete serv.bannedPlayers[uuid];
      return true;
    } else {
      return false;
    }
  }
  
  serv.bannedPlayers = {};
  serv.ban = ban;
  serv.banUsername = banUsername;
  serv.pardonUsername = pardonUsername;
  serv.getUUIDFromUsername = getUUIDFromUsername;
}