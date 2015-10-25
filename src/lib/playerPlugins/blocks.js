module.exports=inject;

function inject(serv,player)
{
  async function changeBlock(position,blockType)
  {
    player.getNearby().forEach(function(p) {
      p.sendBlock(position, blockType);
    });
    return await player.world.setBlockType(position,blockType);
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