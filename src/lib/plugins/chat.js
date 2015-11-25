var ChatParser = require("minecraft-chat-parser")

module.exports.server=function(serv)
{
  serv.broadcast = (message, color) =>
    serv.players.forEach(player => player.chat({
      "text": message,
      "color": color
    }));
  serv.broadcastColor = (message) =>
    serv.players.forEach(player => player.chat(
        ChatParser(message)
      )    
    )
};

module.exports.player=function(player,serv)
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