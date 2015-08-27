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

  player.changeBlock=changeBlock;
}