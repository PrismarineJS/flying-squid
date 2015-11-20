var Vec3 = require("vec3").Vec3;

module.exports.player=function(player,serv)
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


  player.commands.add({
    base: 'setblock',
    info: 'to put a block',
    usage: '/setblock <x> <y> <z> <id> <data>',
    parse(str) {
      var results = str.match(/^(~|~?-?[0-9]*) (~|~?-?[0-9]*) (~|~?-?[0-9]*) ([0-9]{1,3}) ([0-9]{1,3})/);
      if(!results) return false;
      return results;
    },
    action(params) {
      var res = params.map((num, i) => { // parseInt paramaters
        if (num.indexOf('~') == 0) {
          return (player.position[['', 'x', 'y', 'z'][i]] >> 5) + parseInt(num.slice(1) || 0);
        } else {
          return parseInt(num); // return parseInt>>5 if position, not id
        }
      });

      player.setBlock(new Vec3(res[1], res[2], res[3]), res[4],res[5]);
    }
  });
};