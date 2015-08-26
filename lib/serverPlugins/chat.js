module.exports=inject;

function inject(serv)
{
  function broadcast(message, color) {
    serv.players.forEach(function(player){
      var msg = {
        "text": message,
        "color": color
      };
      player.chat(msg);
    });
  }

  serv.broadcast=broadcast;
}