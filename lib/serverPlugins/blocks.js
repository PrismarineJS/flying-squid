module.exports=inject;

function inject(serv)
{
  function setBlock(position,blockType)
  {
    serv.players.forEach(function(player){
      player.sendBlock(position, blockType);
    });
    serv.world.setBlockType(position.x,position.y,position.z,blockType);
  }
  
  serv.setBlock = setBlock;
}