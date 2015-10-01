var moment=require("moment");
var rp=require("request-promise");
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

  function getUUIDFromUsername(username) {
    return rp('https://api.mojang.com/users/profiles/minecraft/' + username)
      .then((body) => {
        if(!body) throw new Error("username not found");
        return uuidInParts(JSON.parse(body).id)
      })
      .catch(err => {throw new Error("username not found");});
  }

  function banUsername(username, reason, cb) {
    return serv.getUUIDFromUsername(username)
      .then(uuid => serv.ban(uuid, reason));
  }

  function pardonUsername(username, cb) {
    return serv.getUUIDFromUsername(username)
      .then(pardon);
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