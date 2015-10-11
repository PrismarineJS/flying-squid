var Vec3 = require('vec3');

module.exports = inject;

function inject(serv, player, options) {
  /*function handleCommand(command) {
    var results;
    if (options.commands[command])
      player.chat("" + options.commands[command]);
    else if (results = command.match(/^gamemode ([0-3])$/)) {
      var gameMode = parseInt(results[1]);
      player.setGameMode(gameMode);
    }
    else if (results = command.match(/^setblock/)) { // Like old version which uses ids
      results = command.match(/^setblock (~|~?-?[0-9]*) (~|~?-?[0-9]*) (~|~?-?[0-9]*) ([0-9]{1,3})/);
      if (!results) {
        player.chat("Usage: /setblock <x> <y> <z> <id>");
      }
      else {
        results = results.map(function (num, i) { // parseInt paramaters
          if (num.indexOf('~') == 0) {
            return (player.entity.position[['', 'x', 'y', 'z'][i]] >> 5) + parseInt(num.slice(1) || 0);
          }
          else
            return parseInt(num); // return parseInt>>5 if position, not id
        });
        serv.setBlock(new Vec3(results[1], results[2], results[3]), results[4]);
      }
    }
    else if (results = command.match(/^kick/)) {
      results = command.match(/^kick ([a-zA-Z0-9_]+)(?: (.*))?/);
      if (!results) {
        player.chat("Usage: /kick <player> [reason]");
      }
      else {
        var username = results[1];
        var reason = results[2];

        var kickPlayer = serv.getPlayer(username);
        if (!kickPlayer)
          player.chat(results[1] + " is not on this server!");
        else {
          kickPlayer.kick(reason);
          kickPlayer.emit("kicked",player,reason);
        }
      }
    }
    else if (results = command.match(/^ban/)) {
      results = command.match(/^ban ([a-zA-Z0-9_]+)(?: (.*))?/);
      if (!results) {
        player.chat("Usage: /ban <player> [reason]");
      }
      else {
        username = results[1];
        reason = results[2];
        var banPlayer = serv.getPlayer(username);
        if (banPlayer) {
          banPlayer.ban(reason);
          serv.emit("banned",player,username,reason);
        }
        else {
          serv.banUsername(username, reason)
            .then(()=>{
              serv.emit("banned",player,username,reason);
              player.chat(results[1] + " was banned");
            })
            .catch(err => player.chat(results[1] + " is not a valid player!"));
        }
      }
    }
    else if (results = command.match(/^pardon/)) {
      results = command.match(/^pardon ([a-zA-Z0-9_]+)/);
      if (!results) {
        player.chat("Usage: /pardon <player>");
      }
      else {
        serv.pardonUsername(results[1])
          .then(()=> player.chat(results[1] + " is unbanned"))
          .catch(err => player.chat(results[1] + " is not banned"));
      }
    }
    else if(results = command.match(/^time (add|query|set)(?: ([0-9]+))?/)) {
      var action=results[1];
      var value=results[2]!==undefined ? parseInt(results[2]) : null;
      if(action=="query")
        player.chat("It is "+serv.time);
      else if(action=="set") {
        player.chat("Time was changed from "+serv.time+" to "+value);
        serv.setTime(value);
      }
      else if(action=="add") {
        player.chat("Time was changed from "+serv.time+" to "+(value + serv.time));
        serv.setTime(value + serv.time);
      }
    }
    else if(results = command.match(/^modpe (.+)$/)) {
      player.emit("modpe",results[1]);
    }
    else
      player.chat("Invalid command.");
  }*/

  function handleCommand(command) {
    var answer = serv.runCommand(command, player);
    if (answer.success) {
      player.chat(answer.message);
    } else {
      player.chat('§r' + answer.message);
    }
  }

  player.handleCommand = handleCommand;
}