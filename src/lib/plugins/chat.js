module.exports.server=function(serv)
{
  serv.broadcast = (message, color) =>
    serv.players.forEach(player => player.chat({
      "text": message,
      "color": color
    }));
};

module.exports.player=function(player,serv)
{
  player._client.on('chat', ({message} = {}) => {
    if(message[0]=="/") {
      player.behavior('command', {
        message: message
      }, ({message}) => {
        var command = message.slice(1);
        player.handleCommand(command);
      });
    }
    else {
      player.behavior('chat', {
        message: message,
        broadcastMessage: '<' + player.username + '>' + ' ' + message,
        broadcast: true
      }, ({message, broadcast, broadcastMessage}) => {
        if (broadcast) serv.broadcast(broadcastMessage);
      });
    }
  });

  player.chat = message => {
    player._client.write('chat', { message: JSON.stringify(message), position: 0 });
  };

  player.system = message => {
    player._client.write('chat', { message: JSON.stringify(message), position: 2 });
  };
};