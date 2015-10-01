module.exports=inject;

function inject(serv)
{
  function setBlock(position,blockType)
  {
    serv.players.forEach(function(player){
      player.sendBlock(position, blockType);
    });
    return serv.world.setBlockType(position,blockType);
  }
  
  serv.setBlock = setBlock;
}