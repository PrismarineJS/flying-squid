  module.exports=inject;

function inject(serv, player)
{
  player.playerlistUpdateText = (header, footer) =>
    player._client.write('playerlist_header', {
      header: JSON.stringify(header),
      footer: JSON.stringify(footer)
    });

  player.playerlistUpdateText("Flying squid", "Test server");
}
