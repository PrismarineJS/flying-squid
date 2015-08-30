var Entity=require("prismarine-entity");
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
  function addPlayer()
  {
    serv.entityMaxId++;
    player.entity=new Entity(serv.entityMaxId);
    serv.entities[player.entity.id]=player.entity;
    player.entity.player=player;
    player.entity.health = 20;
    player.entity.food = 20;
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

  function sendSpawnPosition()
  {
    console.log("setting spawn at "+player.spawnPoint);
    player._client.write('spawn_position',{
      "location":player.spawnPoint
    });
  }

  function sendInitialPosition()
  {
    player.entity.position=player.spawnPoint;
    player.entity.yaw=0;
    player.entity.pitch=0;
    player._client.write('position', {
      x: player.entity.position.x,
      y: player.entity.position.y,
      z: player.entity.position.z,
      yaw: player.entity.yaw,
      pitch: player.entity.pitch,
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

  function setGameMode(gameMode)
  {
    player._client.write('game_state_change', {
      reason: 3,
      gameMode: gameMode
    });
    player.gameMode=gameMode;
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


  function spawnOthers()
  {
    player.getOthers().forEach(function (otherPlayer) {
      player._client.write('named_entity_spawn', {
        entityId: otherPlayer.entity.id,
        playerUUID: transformUuid(otherPlayer._client.uuid),
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

  function spawn()
  {
    var spawnPoint=toFixedPosition(player.spawnPoint);
    player._writeOthers('named_entity_spawn',{
      entityId: player.entity.id,
      playerUUID: transformUuid(player._client.uuid),
      x: player.entity.position.x,
      y: player.entity.position.y,
      z: player.entity.position.z,
      yaw: player.entity.yaw,
      pitch: player.entity.pitch,
      currentItem: 0,
      metadata: player.entity.metadata
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
    sendSpawnPosition();
    sendInitialPosition();

    player.emit("spawned");

    updateTime();
    setGameMode(player.gameMode);
    fillTabList();
    spawnOthers();
    spawn();

    announceJoin();
  }


  player.setGameMode=setGameMode;
  player.login=login;
  player.sendInitialPosition=sendInitialPosition;
  player.spawn=spawn;
}