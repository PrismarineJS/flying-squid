var moment=require("moment");
var request=require("request");
var nodeUuid=require('node-uuid');

module.exports = inject;

function inject(serv)
{

  function ban(uuid, reason) {
    serv.bannedPlayers[uuid] = {
      time: +moment(),
      reason: reason || "You are banned!"
    };
  }

  function uuidInParts(plainUUID)
  {
    return nodeUuid.unparse(nodeUuid.parse(plainUUID));
  }

  function getUUIDFromUsername(username, cb) {
    request('https://api.mojang.com/users/profiles/minecraft/' + username, function(err, res, body) {
      if(!body || err)
      {
        cb(new Error("username not found"));
        return;
      }
      cb(null,uuidInParts(JSON.parse(body).id));
    });
  }

  function banUsername(username, reason, cb) {
    serv.getUUIDFromUsername(username, function(err,uuid) {
      if(err)
      {
        cb(err);
        return;
      }
      serv.ban(uuid, reason);
      cb();
    });
  }

  function pardonUsername(username, cb) {
    serv.getUUIDFromUsername(username, function(err,uuid) {
      if(err)
      {
        cb(err);
        return;
      }
      var result=pardon(uuid);
      if(!result)
      {
        cb(new Error("Player wasn't banned."));
        return;
      }
      cb();
    });
  }

  function pardon(uuid) {
    if (serv.bannedPlayers[uuid]) {
      delete serv.bannedPlayers[uuid];
      return true;
    }
    return false;
  }

  serv.bannedPlayers = {};
  serv.ban = ban;
  serv.banUsername = banUsername;
  serv.pardonUsername = pardonUsername;
  serv.getUUIDFromUsername = getUUIDFromUsername;
}