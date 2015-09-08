  module.exports=inject;

function inject(serv, player)
{
  function playerlistUpdateText(header, footer) {
    player._client.write('playerlist_header', {
      header: JSON.stringify(header),
      footer: JSON.stringify(footer)
    });
  }

  playerlistUpdateText("Flying squid", "Test server")

  player.playerlistUpdateText=playerlistUpdateText;
}
