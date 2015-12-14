var Vec3 = require('vec3').Vec3;
var async = require('async-q');

var redstoneRelated = [55, 75, 76, 93, 94, 123, 124, 152, 356, 404, 29, 33];
var levelSides = [new Vec3(1, 0, 0,), new Vec3(-1, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 0, -1)]; // Adjacent flat sides
var aboveAndBelow = [new Vec3(0, 1, 0), new Vec3(0, -1, 0)]; // Above and below
var diagonalsAbove = [new Vec3(1, 1, 0), new Vec3(-1, 1, 0), new Vec3(0, 1, 1), new Vec3(0, 1, -1)] // levelSides + 1
var diagonalsBelow = [new Vec3(1, -1, 0), new Vec3(-1, -1, 0), new Vec3(0, -1, 1), new Vec3(0, -1, -1)]; // levelSides - 1
var allDiagonals = diagonalsAbove.concat(diagonalsBelow); // levelSides + 1 and levelSides - 1
var allAdjacentSides = levelSides.concat(aboveAndBelow);

module.exports.server = function(serv) {
 
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

  serv.on('tick', async (time, ticknum) => {
    await updateRedstone();
  });

  async function updateRedstone(blocksToChange=[]) {
    //if (blocksToChange.length) console.log(blocksToChange);
    var redstoneUpdates = serv.currentTick.filter(t => t.type == 'redstone');
    serv.currentTick = serv.currentTick.filter(t => t.type != 'redstone');
    //if (redstoneUpdates.length != 0) console.log('Have ' + redstoneUpdates.length + ' updates!');
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
    return async.map(redstoneUpdates, async (action) => {
      var block = await getBlock(action.world, action.position, blocksToChange);
      var id = block.type;
      var data = block.data;
      if (id == 55) { // Redstone Dust
        return await serv.tickRedstoneDust(action.world, action.position, blocksToChange);
      }
    }).then((results) => {
      blocksToChange = blocksToChange.filter(b => {
        var getRid = false;
        results.forEach(r => {
          if (b.position == r.position && b.world == r.world) getRid = true;
        });
        return !getRid;
      });
      updateRedstone(blocksToChange.concat(results))
    });
  }

  serv.tickRedstoneDust = async (world, pos, extras) => {
    var currentPower = await getBlock(world, pos, extras).metadata;
    var aboveBlock = await getBlock(world, pos.plus(new Vec3(0, 1, 0)), extras);
    var sides = levelSides.map(s => pos.plus(s));
    var sidesUp = sides.map(s => s.plus(new Vec3(0, 1, 0)));
    var check = sides;
    if (aboveBlock.boundingBox != 'block') check = check.concat(sidesUp);
    sides.forEach(async (s) => {
      var block = await getBlock(world, s, extras);
      if (block.boundingBox == 'block') return;
      var blockBelowId = await getBlock(world, pos.plus(s).plus(new Vec3(0, -1, 0)), extras).type;
      if (blockBelowId == '55') check.push(s.plus(new Vec3(0, -1, 0)));
    });
    var maxPower = 0;
    var redstoneDusts = [];
    await async.map(check, async(c) => {
      var id = await getBlock(world, c, extras).id;
      if (id == 5) redstoneDusts.push(c);
    });
    await async.map(check, async (c) => {
      var power = await getPower(world, c, extras, true, true);
      if (power > maxPower) maxPower = power;
    });
    //console.log(check);
    //console.log('POWR',maxPower,currentPower);
    if (maxPower != currentPower) {
      //updateAdjacent(world, pos);
      return {
        world: world,
        position: pos,
        type: 55,
        data: maxPower
      };
    }
  }

  function updateAdjacent(world, position) {
    actionOnEach(allAdjacentSides, position, (pos) => {
      serv.newAction({
        world: world,
        position: pos,
        type: 'redstone'
      });
    });
  }

  function updateArray(world, positions) {
    positions.forEach(p => {
      serv.newAction({
        world: world,
        position: p,
        type: 'redstone'
      });
    });
  }

  async function getBlock(world, position, extras) {
    if (extras) {
      var index = findInArray({ world: world, position: position }, extras);
      console.log(extras, position);
      if (index != -1) return {
        type: extras[index].type,
        metadata: extras[index].data,
        redstone: extras[index].redstone
      }
    }
    console.log('else');
    return await world.getBlock(position);
  }

  function findInArray(item, arr) {
    var ind = -1;
    arr.forEach((a, index) => {
      if (ind != -1) return;
      var success = true;
      Object.keys(item).forEach(key => {
        if (a[key] != item[key]) success = false;
      });
      if (success) ind = index;
    });
    return ind;
  }

  async function getPower(world, position, extras=[], strongOnly=false, subOne=false) {
    var block = await getBlock(world, position, extras);
    if (!block.redstone) block.redstone = {
      strength: 0,
      strong: false
    };
    var id = block.type;
    var data = block.metadata;
    var redstone = block.redstone;

    if (id == 55) { // Redstone dust
      return subOne ? Math.max(0, data - 1) : data;
    } else if (id == 76 || id == 152) { // Sources: redstone block / redstone torch
      return 15;
    } else if (redstone.strength) {
      return strongOnly && !redstone.strong ? 0 : redstone.strength;
    }

    return 0;
  }
}

function actionOnEach(sides, position, action) {
  sides.forEach(side => {
    action(position.plus(side));
  });
}

module.exports.player = function(player, serv) {
  player.on('placeBlock_cancel', async (opt, cancel) => {
    if (opt.id == 331) {
      opt.id = 55;
      var below = await player.world.getBlock(opt.position.plus(new Vec3(0, -1, 0)));
      if (below.boundingBox != 'block') cancel();
    }
    await testNearby(opt.position);
  });

  player.on('dug', async ({position}) => {
    await testNearby(position);
  });

  async function testNearby(position, self=true) {
    actionOnEach(allAdjacentSides, position, async (pos) => {
      var id = await player.world.getBlockType(pos);
      if (redstoneRelated.indexOf(id) != -1) serv.newAction({
        world: player.world,
        position: pos,
        type: 'redstone'
      });
    });
    if (self) {
      serv.newAction({
        world: player.world,
        position: position,
        type: 'redstone'
      });
    }
  }
}