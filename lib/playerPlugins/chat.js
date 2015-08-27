module.exports=inject;

function inject(serv, player, options)
{
  player._client.on('chat', function (data) {
  if(data.message[0]=="/" && options.commands[data.message.slice(1)]) {
    player.chat("" + options.commands[data.message.slice(1)]);
  } else if(data.message == "/gamemode" || data.message == "/gamemode 0" || data.message == "/gamemode 1") {

    if(data.message == "/gamemode 0") {
      player._client.write("game_state_change", {
        reason: 3,
        gameMode: 0
      });
      player.gameMode = 0;
      player.chat("Gamemode changed to 0!");
    } else if(data.message == "/gamemode 1") {
      player._client.write("game_state_change", {
        reason: 3,
        gameMode: 1
      });
      player.gameMode = 1;
      player.chat("Gamemode changed to 1!")
    } else {
      player.chat("Invalid usage! Try using /gamemode 1");
    }
  } else {

    serv.broadcast('<' + player.username + '>' + ' ' + data.message);
    player.emit("chat",data.message);
  }
  });

  function chat(message) {
    player._client.write('chat', { message: JSON.stringify(message), position: 0 });
  }

  player.chat=chat;
}