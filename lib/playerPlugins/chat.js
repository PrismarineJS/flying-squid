module.exports=inject;

function inject(serv, player)
{
  player._client.on('chat', function (packet) {
    if(packet.message[0]=="/") {
      var command = packet.message.slice(1);
      player.handleCommand(command);
    }
    else {
      serv.broadcast('<' + player.username + '>' + ' ' + packet.message);
      player.emit("chat",packet.message);
    }
  });

  function chat(message) {
    player._client.write('chat', { message: JSON.stringify(message), position: 0 });
  }

  player.chat=chat;
}