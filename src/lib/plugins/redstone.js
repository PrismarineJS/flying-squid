var redstone = require('flying-squid').redstone;
var async = require('async-q');
var Vec3 = require('vec3').Vec3;

module.exports.server = function(serv) {

  serv.on('setBlock', ({world, position, type, data}) => {
    //console.log('setBlock Action Update');
    testNearby(world, position);
  });

  serv.on('tick', async (time, ticknum) => {
    var redstoneUpdates = serv.currentTick.filter(t => t.type == 'redstone');
    serv.currentTick = serv.currentTick.filter(t => t.type != 'redstone');
    console.log(redstoneUpdates);
    var {blocks,updates} = await redstone.tick(redstoneUpdates);
    serv.scheduledTicks = serv.scheduledTicks.concat(updates);
    return async.map(blocks, (b) => {
      b.world.setBlock(b.position, b.type, b.data);
    });
  });

  var levelSides = [new Vec3(1, 0, 0), new Vec3(-1, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 0, -1)]; // Adjacent flat sides
  var aboveAndBelow = [new Vec3(0, 1, 0), new Vec3(0, -1, 0)]; // Above and below
  var allAdjacentSides = levelSides.concat(aboveAndBelow);

  async function testNearby(world, position, self=true) {
    actionOnEach(allAdjacentSides, position, async (pos) => {
      var id = await world.getBlockType(pos);
      if (id != 0) serv.newAction({
        world: world,
        position: pos,
        type: 'redstone'
      });
    });
    if (self) {
      var id = await world.getBlockType(position);
      if (id != 0) {
        serv.newAction({
          world: world,
          position: position,
          type: 'redstone'
        });
      }
    }
  }

  function actionOnEach(sides, position, action) {
    sides.forEach(side => {
      action(position.plus(side));
    });
  }
}

module.exports.player = function(player, serv) {
  player.on('placeBlock_cancel', async (opt, cancel) => {
    if (opt.id == 331) {
      opt.id = 55;
      var below = await player.world.getBlock(opt.position.plus(new Vec3(0, -1, 0)));
      if (below.boundingBox != 'block') cancel();
    }
  });
}