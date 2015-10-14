var vec3=require("vec3");
var spiralloop = require('spiralloop');

module.exports = inject;

function inject(serv, player) {
  function spawn() {
    player.setPosition(player.spawnPoint, { yaw: 0, pitch: 0, exact: true });
  }

  function spawnForOthers() {
    player._writeOthers('named_entity_spawn',{ // _writeOthersWithinDistance?
      entityId: player.entity.id,
      playerUUID: player._client.uuid,
      x: player.entity.position.x,
      y: player.entity.position.y,
      z: player.entity.position.z,
      yaw: player.entity.yaw,
      pitch: player.entity.pitch,
      currentItem: 0,
      metadata: player.entity.metadata
    });
  }

  function getNearbyPlayers() {
    player.getOthers().forEach(function (otherPlayer) {
      if (otherPlayer.world != player.world) return; // Also check distance from player?
      player._client.write('named_entity_spawn', {
        entityId: otherPlayer.entity.id,
        playerUUID: otherPlayer._client.uuid,
        x: otherPlayer.entity.position.x,
        y: otherPlayer.entity.position.y,
        z: otherPlayer.entity.position.z,
        yaw: otherPlayer.entity.yaw,
        pitch: otherPlayer.entity.pitch,
        currentItem: 0,
        metadata: otherPlayer.entity.metadata
      });
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

  function sendNearbyChunks(view, world)
  {
    world = world || player.world;
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
          .then(() => world.getColumn(chunkX,chunkZ))
          .then((column) => player.sendChunk(chunkX,chunkZ,column))
      ,Promise.resolve());
  }

  function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
  }

  function changeWorld(world, opt) {

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
    player.emit('change_world');
    player.setPosition(opt.position || player.spawnPoint, { yaw: opt.yaw || 0, pitch: opt.pitch || 0 }); // Automatically sends chunks around players
  }

  player.spawn = spawn;
  player.spawnForOthers = spawnForOthers;
  player.getNearbyPlayers = getNearbyPlayers;
  player.sendNearbyChunks = sendNearbyChunks;
  player.changeWorld = changeWorld;
  player.sendChunk = sendChunk;

  player.on('chat', function(message) {
    if (message == 'world') {
      player.changeWorld(serv.netherworld, {
        position: new vec3(0, 60, 0),
        dimension: -1
      });
    }
  });
}