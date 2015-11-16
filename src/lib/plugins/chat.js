module.exports.server=function(serv)
{
  serv.broadcast = (message, color) =>
    serv.players.forEach(player => player.chat({
      "text": message,
      "color": color
    }));
};

module.exports.player=function(serv, player)
{
  player._client.on('chat', ({message} = {}) => {
    if(message[0]=="/") {
      var command = message.slice(1);
      player.handleCommand(command);
    }
    else {
      serv.broadcast('<' + player.username + '>' + ' ' + message);
      player.emit("chat",message);
    }
  });

  player.chat = message => {
    player._client.write('chat', { message: JSON.stringify(message), position: 0 });
  };

  player.system = message => {
    player._client.write('chat', { message: JSON.stringify(message), position: 2 });
  };
};