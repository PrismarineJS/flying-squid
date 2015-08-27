var Entity=require("../entity");
var vec3 = require("vec3");

module.exports=inject;

function transformUuid(s)
{
  return s.split("-").map(function(item) { return parseInt(item, 16); });
}

function toFixedPosition(p)
{
  return new vec3(Math.floor(p.x*32),Math.floor(p.y*32),Math.floor(p.z*32))
}

function inject(serv,player)
{
  player.login=login;

  function addPlayer()
  {
    serv.entityMaxId++;
    player.entity=new Entity(serv.entityMaxId);
    player.username=player._client.username;
    serv.players.push(player);
    serv.uuidToPlayer[player._client.uuid] = player;
  }

  function sendLogin()
  {
    // send init data so client will start rendering world
    player._client.write('login', {
      entityId: player.entity.id,
      levelType: 'default',
      gameMode: player.gameMode,
      dimension: 0,
      difficulty: 0,
      reducedDebugInfo: false,
      maxPlayers: serv._server.maxPlayers
    });
  }
  function sendMap()
  {
    player._client.write('map_chunk', {
      x: 0,
      z: 0,
      groundUp: true,
      bitMap: 0xffff,
      chunkData: serv.world.dump()
    });
  }

  function sendSpawn()
  {
    console.log("setting spawn at "+player.spawnPoint);
    player._client.write('spawn_position',{
      "location":player.spawnPoint
    });
  }

  function sendInitialPosition()
  {
    player._client.write('position', {
      x: player.spawnPoint.x,
      y: player.spawnPoint.y,
      z: player.spawnPoint.z,
      yaw: 0,
      pitch: 0,
      flags: 0x00
    });
  }

  function updateTime()
  {
    player._client.write('update_time', {
      age: [0, 0],
      time: [0, 1]
    });
  }

  function updateGameState()
  {
    player._client.write('game_state_change', {
      reason: 3,
      gameMode: player.gameMode
    });
  }

  function fillTabList()
  {
    player._writeOthers('player_info',{
        action: 0,
        data: [{
          UUID: transformUuid(player._client.uuid),
          name: player.username,
          properties: [],
          gamemode: player.gameMode,
          ping: 1,
          hasDisplayName: true,
          displayName: player.username
        }]
      });

    player._client.write('player_info', {
      action: 0,
      data: serv.players
        .map(function (otherPlayer) {
          return {
            UUID: transformUuid(otherPlayer._client.uuid),
            name: otherPlayer.username,
            properties: [],
            gamemode: otherPlayer.gameMode,
            ping: 1,
            hasDisplayName: true,
            displayName: otherPlayer.username
          };
        })
    });
  }

  function spawn()
  {
    player.getOthers().forEach(function (otherPlayer) {
      var spawnPoint=toFixedPosition(otherPlayer.spawnPoint);
      var pos = otherPlayer.entity.position;
      player._client.write('named_entity_spawn', {
        entityId: otherPlayer.entity.id,
        playerUUID: transformUuid(otherPlayer._client.uuid),
        x: pos ? pos.x : spawnPoint.x,
        y: pos ? pos.y : spawnPoint.y,
        z: pos ? pos.z : spawnPoint.z,
        yaw: 0,
        pitch: 0,
        currentItem: 0,
        metadata: []
      });
    });

    var spawnPoint=toFixedPosition(player.spawnPoint);
    player._writeOthers('named_entity_spawn',{
      entityId: player.entity.id,
      playerUUID: transformUuid(player._client.uuid),
      x: spawnPoint.x,
      y: spawnPoint.y,
      z: spawnPoint.z,
      yaw: 0,
      pitch: 0,
      currentItem: 0,
      metadata: []
    });
  }

  function announceJoin()
  {
    serv.broadcast(player.username + ' joined the game.', "yellow");
    player.emit("connected");
  }

  function login()
  {
    if (serv.uuidToPlayer[player._client.uuid]) {
      player._client.end("You are already connected");
      return;
    }
    addPlayer();
    sendLogin();
    sendMap();
    sendSpawn();
    sendInitialPosition();

    player.emit("spawned");

    updateTime();
    updateGameState();
    fillTabList();
    spawn();

    announceJoin();


    player._client.on('end', function () {
      serv.broadcast(player.username + ' quit the game.', "yellow");
      player._writeOthers('player_info', {
        action: 4,
        data: [{
          UUID: transformUuid(player._client.uuid)
        }]
      });
      player._writeOthers('entity_destroy', {'entityIds': [player.entity.id]});
      player.emit('disconnect');
      var index = serv.players.indexOf(player);
      if (index > -1) {
        serv.players.splice(index,1);
       }
      delete serv.uuidToPlayer[player._client.uuid];
    });


    player._client.on('error', function (error) {
      player.emit('error',error);
    });
  }
}