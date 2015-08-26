module.exports=inject;

function inject(serv,player)
{
  player._client.on('chat', function (data) {
    serv.broadcast('<' + player._client.username + '>' + ' ' + data.message);
    player.emit("chat",data.message);
  });

  function chat(message) {
    player._client.write('chat', { message: JSON.stringify(message), position: 0 });
  }

  player.chat=chat;
}