module.exports=inject;

function inject(serv,player)
{
  async function changeBlock(position,blockType)
  {
    serv.players.filter(p => p.world==player.world).forEach(function(p) {
      p.sendBlock(position, blockType);
    });
    return await player.world.setBlockType(position,blockType);
  }
  
  function sendBlock(position, blockType) { // Call from player.setBlock unless you want "local" fake blocks
    player._client.write("block_change",{
        location:position,
        type:blockType<<4
    });
  }

  function setBlock(position,blockType)
  {
    serv.players.filter(p => p.world==player.world).forEach(function(player){
      player.sendBlock(position, blockType);
    });
    return player.world.setBlockType(position,blockType);
  }

  player.setBlock = setBlock;

  player.changeBlock=changeBlock;
  player.sendBlock=sendBlock;
}