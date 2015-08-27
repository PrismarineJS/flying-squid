module.exports=inject;

function inject(serv, player, options)
{
  player._client.on('chat', function (data) {
  if(data.message[0]=="/" && options.commands[data.message.slice(1)]) {
    player.chat("" + options.commands[data.message.slice(1)]);
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