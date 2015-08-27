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
    else
      player.chat("Invalid command.");
  }

  player.handleCommand=handleCommand;
}