var moment=require("moment");
var rp=require("request-promise");
var nodeUuid=require('node-uuid');

module.exports.server=function(serv)
{

  serv.ban = (uuid, reason) => {
    serv.bannedPlayers[uuid] = {
      time: +moment(),
      reason: reason || "You are banned!"
    };
  };

  function uuidInParts(plainUUID)
  {
    return nodeUuid.unparse(nodeUuid.parse(plainUUID));
  }

  serv.getUUIDFromUsername =  username => {
    return rp('https://api.mojang.com/users/profiles/minecraft/' + username)
      .then((body) => {
        if(!body) throw new Error("username not found");
        return uuidInParts(JSON.parse(body).id)
      })
      .catch(err => {throw new Error("username not found");});
  };

  serv.banUsername = (username, reason, cb) => {
    return serv.getUUIDFromUsername(username)
      .then(uuid => serv.ban(uuid, reason));
  };

  serv.pardonUsername = (username, cb) => {
    return serv.getUUIDFromUsername(username)
      .then(pardon);
  };

  function pardon(uuid) {
    if (serv.bannedPlayers[uuid]) {
      delete serv.bannedPlayers[uuid];
      return true;
    }
    return false;
  }

  serv.bannedPlayers = {};
};

module.exports.player=function(player,serv)
{
  player.kick = reason =>
  {
    player._client.write('kick_disconnect', {
      reason: reason ? JSON.stringify(reason) : '"You were kicked!"'
    });
  };

  player.ban = reason => {
    reason = reason || "You were banned!";
    player.kick(reason);
    var uuid=player._client.uuid;
    serv.ban(uuid, reason);
  };

  player.pardon = () => serv.pardon(player._client.uuid);



  player.commands.add({
    base: 'kick',
    info: 'to kick a player',
    usage: '/kick <player> [reason]',
    parse(str) {
      if(!str.match(/([a-zA-Z0-9_]+)(?: (.*))?/))
        return false;
      var parts = str.split(' ');
      return {
        username:parts.shift(),
        reason:parts.join(' ')
      };
    },
    action({username,reason}) {
      var kickPlayer = serv.getPlayer(username);
      if (!kickPlayer) {
        player.chat(username + " is not on this server!");
      } else {
        kickPlayer.kick(reason);
        kickPlayer.emit("kicked", player, reason);
      }
    }
  });

  player.commands.add({
    base: 'ban',
    info: 'to ban a player',
    usage: '/ban <player> [reason]',
    parse(str) {
      if(!str.match(/([a-zA-Z0-9_]+)(?: (.*))?/))
        return false;
      var parts = str.split(' ');
      return {
        username:parts.shift(),
        reason:parts.join(' ')
      };
    },
    action({username,reason}) {
      var banPlayer = serv.getPlayer(username);

      if (!banPlayer) {
        serv.banUsername(username, reason)
          .then(() => {
            serv.emit('banned', player, username, reason);
            player.chat(username + ' was banned');
          })
          .catch(err => player.chat(username + " is not a valid player!"));
      } else {
        banPlayer.ban(reason);
        serv.emit("banned", player, username, reason);
      }
    }
  });

  player.commands.add({
    base: 'pardon',
    info: 'to pardon a player',
    usage: '/pardon <player>',
    parse(str) {
      if(!str.match(/([a-zA-Z0-9_]+)/))
        return false;
      return str;
    },
    action(nick) {
      serv.pardonUsername(nick)
        .then(()=> player.chat(nick + " is unbanned"))
        .catch(err => player.chat(nick + " is not banned"));
    }
  });
};