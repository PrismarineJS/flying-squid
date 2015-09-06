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
    else
      player.chat("Invalid command.");
  }

  player.handleCommand=handleCommand;
}