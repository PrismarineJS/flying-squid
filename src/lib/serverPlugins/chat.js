module.exports=inject;

function inject(serv)
{
  serv.broadcast = (message, color) =>
    serv.players.forEach(player => player.chat({
      "text": message,
      "color": color
    }));
}