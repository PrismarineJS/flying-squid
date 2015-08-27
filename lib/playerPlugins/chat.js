module.exports=inject;

function inject(serv, player, options)
{
  player._client.on('chat', function (packet) {
    if(!handleCommand(packet.message)) {
      serv.broadcast('<' + player.username + '>' + ' ' + packet.message);
      player.emit("chat",packet.message);
    }
  });

  function handleCommand(message)
  {
    var command;
    if(message[0]=="/")
      command=message.slice(1);
    else return false;

    if(options.commands[command]) {
      player.chat("" + options.commands[command]);
      return true;
    }
    var results;
    if(results=command.match(/^gamemode ([0-3])$/)) {
      var gameMode=parseInt(results[1]);
      player.setGameMode(gameMode);
      return true;
    }
    player.chat("Invalid command.");
    return true;
  }

  function chat(message) {
    player._client.write('chat', { message: JSON.stringify(message), position: 0 });
  }

  player.chat=chat;
}