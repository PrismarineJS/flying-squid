module.exports=inject;

function inject(serv,player)
{
  // doesn't check whether the player actually wait the correct time
  player._client.on("block_dig",function(packet){
    if(packet.status==2 || (packet.status==0 && player.gameMode==1))
      player.changeBlock(packet.location,0);
  });

}