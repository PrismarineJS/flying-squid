module.exports=inject;

function inject(serv,player)
{
  function changeBlock(position,blockType)
  {
    player.getOthers().forEach(function(player) {
      player.sendBlock(position, blockType);
    });
    return serv.world.setBlockType(position,blockType);
  }
  
  function sendBlock(position, blockType) { // Call from serv.setBlock unless you want "local" fake blocks
    player._client.write("block_change",{
        location:position,
        type:blockType<<4
    });
  }

  player.changeBlock=changeBlock;
  player.sendBlock=sendBlock;
}