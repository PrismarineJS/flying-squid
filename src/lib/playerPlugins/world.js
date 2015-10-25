var vec3=require("vec3");
var spiralloop = require('spiralloop');

module.exports = inject;

function inject(serv, player) {

  function spawnAPlayer(spawnedPlayer) {
    player._client.write('named_entity_spawn', {
      entityId: spawnedPlayer.entity.id,
      playerUUID: spawnedPlayer._client.uuid,
      x: spawnedPlayer.entity.position.x,
      y: spawnedPlayer.entity.position.y,
      z: spawnedPlayer.entity.position.z,
      yaw: spawnedPlayer.entity.yaw,
      pitch: spawnedPlayer.entity.pitch,
      currentItem: 0,
      metadata: spawnedPlayer.entity.metadata
    });
  }

  function sendChunk(chunkX,chunkZ,column)
  {
    player._client.write('map_chunk', {
      x: chunkX,
      z: chunkZ,
      groundUp: true,
      bitMap: 0xffff,
      chunkData: column.dump()
    });
    return Promise.resolve();
  }

  function spiral(arr)
  {
    var t=[];
    spiralloop(arr,function(x,z){
      t.push([x,z]);
    });
    return t;
  }

  function sendNearbyChunks(view)
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
      .reduce((acc,{chunkX,chunkZ})=>
         acc
          //.then(() => sleep(100))
          .then(() => player.world.getColumn(chunkX,chunkZ))
          .then((column) => player.sendChunk(chunkX,chunkZ,column))
      ,Promise.resolve());
  }

  function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
  }

  function sendMap()
  {
    return player.sendNearbyChunks(3)
      .catch((err) => setTimeout(function() { throw err; }), 0);
  }

  function sendRestMap()
  {
    player.sendingChunks=true;
    player.sendNearbyChunks(player.view)
      .then(() => player.sendingChunks=false)
      .catch((err)=> setTimeout(function(){throw err;},0));
  }

  function sendSpawnPosition()
  {
    console.log("setting spawn at "+player.spawnPoint);
    player._client.write('spawn_position',{
      "location":player.spawnPoint
    });
  }

  async function changeWorld(world, opt) {
    if(player.world == world) return Promise.resolve();
    opt = opt || {};
    player.world = world;
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
    setTimeout(player.sendRestMap,100);
    player.sendPosition();

    player.emit('change_world');
  }

  player.sendNearbyChunks = sendNearbyChunks;
  player.changeWorld = changeWorld;
  player.sendChunk = sendChunk;
  player.sendMap = sendMap;
  player.sendRestMap = sendRestMap;
  player.sendSpawnPosition = sendSpawnPosition;
  player.spawnAPlayer = spawnAPlayer;
}