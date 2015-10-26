module.exports=inject;

function inject(serv,player)
{
  player.changeBlock=async (position,blockType,blockData) =>
  {
    serv.players
      .filter(p => p.world==player.world && player!=p)
      .forEach(p => p.sendBlock(position, blockType, blockData));

    await player.world.setBlockType(position,blockType);
    await player.world.setBlockData(position,blockData);
  };
  
  player.sendBlock = (position, blockType, blockData) =>  // Call from player.setBlock unless you want "local" fake blocks
    player._client.write("block_change",{
        location:position,
        type:blockType<<4 | blockData
    });

  player.setBlock = (position,blockType,blockData) => serv.setBlock(player.world,position,blockType,blockData);
}