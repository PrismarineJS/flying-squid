module.exports=inject;

function inject(serv,player)
{
  function changeBlock(position,blockType)
  {
    player._writeOthers("block_change",{
      location:position,
      type:blockType<<4
    });
    serv.world.setBlockType(position.x,position.y,position.z,blockType);
  }
  
  function setBlock(position, blockType) { // Call from serv.setBlock unless you want "local" fake blocks
    player._client.write("block_change",{
        location:position,
        type:blockType<<4
    });
  }

  player.changeBlock=changeBlock;
  player.setBlock=setBlock;
}