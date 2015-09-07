module.exports=inject;

function inject(serv, player)
{
  player._client.on('chat', function (packet) {
    var doDefault = cancelEmit(player, "chatMessage", {
        message: packet.message
    });
    if (!doDefault) return;
        
    if(packet.message[0]=="/") {
      doDefault = cancelEmit(player, "command", {
          message: packet.message.slice(1)
      });
      if (!doDefault) return;
      
      var command = packet.message.slice(1);
      player.handleCommand(command);
    }
    else {
      doDefault = cancelEmit(player, "chat", {
          message: packet.message
      });
      if (!doDefault) return;
      
      serv.broadcast('<' + player.username + '>' + ' ' + packet.message);
    }
  });

  function chat(message) {
    player._client.write('chat', { message: JSON.stringify(message), position: 0 });
  }
  function system(message) {
    player._client.write('chat', { message: JSON.stringify(message), position: 2 });
  }
  
  player.chat=chat;
  player.system=system;
}