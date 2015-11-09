var vec3=require("vec3");
var spiralloop = require('spiralloop');

module.exports = inject;

function inject(serv, player) {

  player.spawnEntity = entity => {
    player._client.write(entity.spawnPacketName, entity.getSpawnPacket());
  };

  player.sendChunk = (chunkX,chunkZ,column) =>
  {
    player._client.write('map_chunk', {
      x: chunkX,
      z: chunkZ,
      groundUp: true,
      bitMap: 0xffff,
      chunkData: column.dump()
    });
    return Promise.resolve();
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
    player.lastPositionChunkUpdated=player.entity.position;
    var playerChunkX=Math.floor(player.entity.position.x/16/32);
    var playerChunkZ=Math.floor(player.entity.position.z/16/32);

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
      .reduce((acc,{chunkX,chunkZ},i)=> {
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
    return player.sendNearbyChunks(3)
      .catch((err) => setTimeout(() => { throw err; }), 0);
  };

  player.sendRestMap = () =>
  {
    player.sendingChunks=true;
    player.sendNearbyChunks(player.view,true)
      .then(() => player.sendingChunks=false)
      .catch((err)=> setTimeout(() => {throw err;},0));
  };

  player.sendSpawnPosition = () =>
  {
    console.log("setting spawn at "+player.spawnPoint);
    player._client.write('spawn_position',{
      "location":player.spawnPoint
    });
  };

  player.changeWorld = async (world, opt) => {
    if(player.world == world) return Promise.resolve();
    opt = opt || {};
    player.world = world;
    player.entity.world = world;
    player.loadedChunks={};
    if (typeof opt.gamemode != 'undefined') player.gameMode = opt.gamemode;
    player._client.write("respawn",{
      dimension: opt.dimension || 0,
      difficulty: opt.difficulty || 0,
      gamemode: opt.gamemode || player.gameMode,
      levelType:'default'
    });
    player.entity.position=player.spawnPoint.toFixedPosition();
    player.sendSpawnPosition();
    player.updateAndSpawnNearbyPlayers();

    await player.sendMap();

    player.sendPosition();
    player.emit('change_world');

    await player.waitPlayerLogin();
    player.sendRestMap();

  };
}