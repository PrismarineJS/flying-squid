var spiralloop = require('spiralloop');

var World = require('prismarine-world');
var WorldSync = require("prismarine-world-sync");

var generations=require("flying-squid").generations;

module.exports.server=function(serv,{regionFolder,generation={"name":"diamond_square","options":{"worldHeight":80}}}={}) {
  generation.options.seed=generation.options.seed || Math.random()*Math.pow(2, 32);
  serv.emit("seed",generation.options.seed);
  serv.overworld = new World(generations[generation.name](generation.options), regionFolder);
  serv.netherworld = new World(generations["nether"]({}));
  //serv.endworld = new World(generations["end"]({}));

  serv._worldSync=new WorldSync(serv.overworld);

  // WILL BE REMOVED WHEN ACTUALLY IMPLEMENTED
  serv.overworld.blockEntityData = {};
  serv.netherworld.blockEntityData = {};
  //////////////

  serv.pregenWorld = (world, size=3) => {
    var promises = [];
    for (var x = -size; x < size; x++) {
      for (var z = -size; z < size; z++) {
        promises.push(world.getColumn(x, z));
      }
    }
    return Promise.all(promises);
  };

  serv.setBlock = async (world,position,blockType,blockData,{whitelist,blacklist=[]}={}) =>
  {
    if (!whitelist) whitelist = serv.players.filter(p => p.world == world);
    var players = whitelist.filter(w => blacklist.indexOf(w) == -1);
    players
      .forEach(player => player.sendBlock(position, blockType, blockData));

    await world.setBlockType(position,blockType);
    await world.setBlockData(position,blockData);
    serv.emit('setBlock', {
      world: world,
      position: position,
      type: blockType,
      data: blockData
    });
  };

  //serv.pregenWorld(serv.overworld).then(() => serv.log('Pre-Generated Overworld'));
  //serv.pregenWorld(serv.netherworld).then(() => serv.log('Pre-Generated Nether'));
};

module.exports.player=function(player,serv,settings) {

  player.unloadChunk = (chunkX,chunkZ) =>
  {
    delete player.loadedChunks[chunkX+","+chunkZ];
    player._client.write('map_chunk', {
      x: chunkX,
      z: chunkZ,
      groundUp: true,
      bitMap: 0x0000,
      chunkData: new Buffer(0)
    });
  };

  player.sendChunk = (chunkX,chunkZ,column) =>
  {
    return player.behavior('sendChunk', {
      x: chunkX,
      z: chunkZ,
      chunk: column
    }, ({x, z, chunk}) => {
      player._client.write('map_chunk', {
        x: x,
        z: z,
        groundUp: true,
        bitMap: 0xffff,
        chunkData: chunk.dump()
      });
      return Promise.resolve();
    })
  };

  function spiral(arr)
  {
    var t=[];
    spiralloop(arr,(x,z) => {
      t.push([x,z]);
    });
    return t;
  }

  player.sendNearbyChunks = (view,group) =>
  {
    player.lastPositionChunkUpdated=player.position;
    var playerChunkX=Math.floor(player.position.x/16/32);
    var playerChunkZ=Math.floor(player.position.z/16/32);

    Object.keys(player.loadedChunks)
      .map((key) => key.split(",").map(a => parseInt(a)))
      .filter(([x,z]) => Math.abs(x-playerChunkX)>view || Math.abs(z-playerChunkZ)>view)
      .forEach(([x,z]) => player.unloadChunk(x,z));

    return spiral([view*2,view*2])
      .map(t => ({
        chunkX:playerChunkX+t[0]-view,
        chunkZ:playerChunkZ+t[1]-view
      }))
      .filter(({chunkX,chunkZ}) => {
        var key=chunkX+","+chunkZ;
        var loaded=player.loadedChunks[key];
        if(!loaded) player.loadedChunks[key]=1;
        return !loaded;
      })
      .reduce((acc,{chunkX,chunkZ})=> {
          var p=acc
            .then(() => player.world.getColumn(chunkX, chunkZ))
            .then((column) => player.sendChunk(chunkX, chunkZ, column));
           return group ? p.then(() => sleep(5)) : p;
        }
      ,Promise.resolve());
  };

  function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
  }

  player.sendMap = () =>
  {
    return player.sendNearbyChunks(Math.min(3,settings["view-distance"]))
      .catch((err) => setTimeout(() => { throw err; }), 0);
  };

  player.sendRestMap = () =>
  {
    player.sendingChunks=true;
    player.sendNearbyChunks(Math.min(player.view,settings["view-distance"]),true)
      .then(() => player.sendingChunks=false)
      .catch((err)=> setTimeout(() => {throw err;},0));
  };

  player.sendSpawnPosition = () =>
  {
    player._client.write('spawn_position',{
      "location":player.spawnPoint
    });
  };

  player.changeWorld = async (world, opt) => {
    if(player.world == world) return Promise.resolve();
    opt = opt || {};
    player.world = world;
    player.world = world;
    player.loadedChunks={};
    if (typeof opt.gamemode != 'undefined') player.gameMode = opt.gamemode;
    player._client.write("respawn",{
      dimension: opt.dimension || 0,
      difficulty: opt.difficulty || 0,
      gamemode: opt.gamemode || player.gameMode,
      levelType:'default'
    });
    player.position=player.spawnPoint.toFixedPosition();
    player.sendSpawnPosition();
    player.updateAndSpawn();

    await player.sendMap();

    player.sendSelfPosition();
    player.emit('change_world');

    await player.waitPlayerLogin();
    player.sendRestMap();

  };

  player.commands.add({
    base: 'changeworld',
    info: 'to change world',
    usage: '/changeworld overworld|nether',
    op: true,
    action(world) {
      if(world=="nether") player.changeWorld(serv.netherworld, {dimension: -1});
      if(world=="overworld") player.changeWorld(serv.overworld, {dimension: 0});
    }
  });
};