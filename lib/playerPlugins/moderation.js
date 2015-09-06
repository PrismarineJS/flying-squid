var moment=require("moment");

module.exports=inject;

function inject(serv,player)
{
  function kick(reason)
  {
    player._client.write('kick_disconnect', {
      reason: reason ? JSON.stringify(reason) : '"You were kicked!"'
    });
  }

  function ban(reason) {
    reason = reason || "You were banned!";
    player.kick(reason);
    var uuid=player._client.uuid;
    serv.ban(uuid, reason);
  }

  function pardon() {
    var uuid=player._client.uuid;
    return serv.pardon(uuid);
  }

  player.kick=kick;
  player.ban=ban;
  player.pardon=pardon;
}