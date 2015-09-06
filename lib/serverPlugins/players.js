module.exports=inject;

function inject(serv)
{
  serv.entityMaxId=0;
  serv.players=[];
  serv.uuidToPlayer={};
  serv.entities={};
  
  function getPlayer(username) {
    for (var p in serv.players) {
      if (serv.players[p].username == username) return serv.players[p]
    }
    return null;
  }
  
  serv.getPlayer = getPlayer;
}