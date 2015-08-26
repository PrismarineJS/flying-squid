module.exports=inject;

function inject(serv,player)
{
  // doesn't check whether the player actually wait the correct time
  player._client.on("block_dig",function(packet){
    if(packet.status==2)
    {
      player._writeOthers("block_change",{
        location:packet.location,
        type:0
      });
      serv.world.setBlockType(packet.location.x,packet.location.y,packet.location.z,0);
    }
  });
}