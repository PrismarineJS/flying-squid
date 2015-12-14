var Vec3 = require('vec3').Vec3;
var async = require('async-q');

var redstoneRelated = [55, 75, 76, 93, 94, 123, 124, 152, 356, 404, 29, 33];

module.exports.server = function(serv) {

  var levelSides = [new Vec3(1, 0, 0,), new Vec3(-1, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 0, -1)]; // Adjacent flat sides
  var aboveAndBelow = [new Vec3(0, 1, 0), new Vec3(0, -1, 0)]; // Above and below
  var diagonalsAbove = [new Vec3(1, 1, 0), new Vec3(-1, 1, 0), new Vec3(0, 1, 1), new Vec3(0, 1, -1)] // levelSides + 1
  var diagonalsBelow = [new Vec3(1, -1, 0), new Vec3(-1, -1, 0), new Vec3(0, -1, 1), new Vec3(0, -1, -1)]; // levelSides - 1
  var allDiagonals = diagonalsAbove.concat(diagonalsBelow); // levelSides + 1 and levelSides - 1
  var allAdjacentSides = levelSides.concat(aboveAndBelow);
 
  var torchDirectionData = {
    0: null,
    1: new Vec3(-1, 0, 0),
    2: new Vec3(1, 0, 0),
    3: new Vec3(0, 0, -1),
    4: new Vec3(0, 0, 1),
    5: new Vec3(0, -1, 0)
  };
  var repeaterDirectionData = {
    0: new Vec3(0, 0, -1),
    1: new Vec3(1, 0, 0),
    2: new Vec3(0, 0, 1),
    3: new Vec3(-1, 0, 0)
  }

  serv.on('setBlock', ({world, position, type, data}) => {
    updateAdjacent(world, position);
  });

  serv.on('tick', async () => {
    updateRedstone();
  });

  async function updateRedstone(blocksToChange=[]) {
    var redstoneUpdates = serv.currentTick.filter(t => t.type == 'redstone');
    if (!redstoneUpdates.length) {
      var worlds = [];
      var posList = {};
      blocksToChange = blocksToChange.filter(d => typeof d != 'undefined');
      blocksToChange.forEach(d => {
        var worldId = worlds.indexOf(d.world);
        if (!worldId) {
          worlds.push(d.world);
          worldId = worlds.length - 1;
        }
        posList[d.position.toString() + ',' + worldId] = d;
      });
      Object.keys(posList).forEach(pos => {
        var d = posList[pos];
        serv.setBlock(d.world, d.position, d.type, d.data);
      });
      return Promise.resolve();
    }
    return async.map(action => {
      var id = action.world.getBlockType(action.position);
      var data = action.world.getBlockData(action.position);
      if (id == '55') { // Redstone Dust
        serv.tickRedstoneDust(action.world, action.position);
      }
    }).then((results) => updateRedstone(blocksToChange.concat(results)));
  }

  serv.tickRedstoneDust = async (world, pos) => {
    var aboveBlock = world.getBlock(pos.plus(new Vec3(0, 1, 0)));
    var sides = levelSides.map(s => pos.plus(s));
    var sidesUp = sides.map(s => s.plus(new Vec3(0, 1, 0)));
    var check = sides;
    if (aboveBlock.boundingBox != 'block') check = check.concat(sidesUp);
    sides.forEach(async (s) => {
      var block = await world.getBlock(s);
      if (block.boundingBox == 'block') return;
      var blockBelowId = await world.getBlockType(s.plus(new Vec3(0, -1, 0)));
      if (blockBelowId == '55') check.push(s.plus(new Vec3(0, -1, 0)));
    });
    var maxPower = 0;
    await async.map(check, async (c) => {
      var power = await getPower(world, c, false, true);
      if (power > maxPower) maxPower = power;
    });
    updateAdjacent();
    return {
      world: world,
      position: pos,
      type: 55,
      data: maxPower
    };
  }

  function actionOnEach(sides, position, action) {
    sides.forEach(side => {
      action(position.plus(side));
    });
  }

  function updateAdjacent(world, position) {
    actionOnEach(allAdjacentSides, position, async (pos) => {
      serv.newAction({
        world: world,
        position: pos,
        type: 'redstone'
      });
    });
  }

  async function getPower(world, position, strong, subOne) {
    var block = await world.getBlock(position);
    if (!block.redstone) block.redstone = {
      strength: 0,
      strong: false
    };
    var id = block.id;
    var data = block.data;
    var redstone = block.redstone;

    if (id == 55) { // Redstone dust
      return subOne ? Math.min(0, data - 1) : data;
    } else if (id == 76 || id == 152) { // Sources: redstone block / redstone torch
      return 15;
    } else if (redstone.strength) {
      return !strong && !redstone.strong ? 0 : redstone.strength;
    }

    return 0;
  }
}

module.exports.player = function(player, serv) {
  player.on('placeBlock_cancel', async (opt, cancel) => {
    if (opt.id == 331) {
      opt.id = 55;
      var below = await player.world.getBlock(opt.position.plus(new Vec3(0, -1, 0)));
      if (below.boundingBox != 'block') cancel();
    }
    if (redstoneRelated.indexOf(opt.id)) {
      serv.newAction({
        world: player.world,
        position: opt.position,
        type: 'redstone'
      });
    }
  });
}