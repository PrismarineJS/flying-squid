var moment=require("moment");

module.exports=inject;

function inject(serv,player)
{
  player.kick = reason =>
  {
    player._client.write('kick_disconnect', {
      reason: reason ? JSON.stringify(reason) : '"You were kicked!"'
    });
  };

  player.ban = reason => {
    reason = reason || "You were banned!";
    player.kick(reason);
    var uuid=player._client.uuid;
    serv.ban(uuid, reason);
  };

  player.pardon = () => {
    var uuid=player._client.uuid;
    return serv.pardon(uuid);
  };
}