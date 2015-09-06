var Vec3 = require('vec3');

module.exports=inject;

function inject(serv, player, options)
{
  function handleCommand(command)
  {
    var results;
    if(options.commands[command])
      player.chat("" + options.commands[command]);
    else if(results=command.match(/^gamemode ([0-3])$/)) {
      var gameMode=parseInt(results[1]);
      player.setGameMode(gameMode);
    }
    else if(results=command.match(/^setblock/)) { // Like old version which uses ids
        results = command.match(/^setblock (~|~?-?[0-9]*) (~|~?-?[0-9]*) (~|~?-?[0-9]*) ([0-9]{1,3})/);
        if(!results) {
            player.chat("Usage: /setblock <x> <y> <z> <id>");
        }
        else {
            results = results.map(function(num, i) { // parseInt paramaters
                if (num.indexOf('~') == 0) {
                    return (player.entity.position[['','x', 'y', 'z'][i]]>>5) + parseInt(num.slice(1) || 0);
                }
                else
                    return parseInt(num); // return parseInt>>5 if position, not id
            });
            serv.setBlock(new Vec3(results[1], results[2], results[3]), results[4]);
        }
    }
    else if(results=command.match(/^kick/)) {
        results = command.match(/^kick ([a-zA-Z0-9]+) ?(.*)/);
        if (!results) {
            player.chat("Usage: /kick <player> [reason]");
        }
        else {
            var kickPlayer = serv.getPlayer(results[1]);
            if (!kickPlayer) {
                player.chat(results[1] + " is not on this server!");
            }
            else {
                kickPlayer.kick(results[2] ? "\"" + results[2] + "\"" : "Kicked from server.");
                serv.log(player.username + " kicked " + results[1] + (results[2] ? " (" + results[2] + ")" : ""));
            }
        }
    }
    else if(results=command.match(/^ban/)) {
        results = command.match(/^ban ([a-zA-Z0-9]+) ?(.*)/);
        if (!results) {
            player.chat("Usage: /ban <player> [reason]");
        }
        else {
            var banPlayer = serv.getPlayer(results[1]);
            var kickReason = "You were banned!" + (results[2] ? " Reason: " + results[2] : "");
            var banReason = "You are banned!" + (results[2] ? " Reason: " + results[2] : "");
            if (banPlayer) banPlayer.ban(banReason, kickReason);
            else {
                serv.banUsername(results[1], banReason, function(success) {
                  if (success) {
                    serv.log(player.username + " banned " + results[1] + (results[2] ? " (" + results[2] + ")" : ""));
                    player.chat(results[1] + " was banned");
                  } else {
                    player.chat(results[1] + " is not a valid player!");
                  }
                });
            }
        }
    }
    else if(results=command.match(/^pardon/)) {
        results = command.match(/^pardon ([a-zA-Z0-9]+)/);
        if (!results) {
            player.chat("Usage: /pardon <player>");
        }
        else {
            serv.pardonUsername(results[1], function(success) {;
                if (success) {
                    player.chat(results[1] + " is unbanned");
                } else {
                    player.chat(results[1] + " is not banned");
                }
            });
        }
    }
    else
      player.chat("Invalid command.");
  }

  player.handleCommand=handleCommand;
}