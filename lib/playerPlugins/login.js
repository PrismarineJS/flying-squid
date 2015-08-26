var Entity=require("../entity");

module.exports=inject;

function transformUuid(s)
{
  return s.split("-").map(function(item) { return parseInt(item, 16); });
}


function inject(serv,player)
{
  player.login=login;

  function addPlayer()
  {
    serv.entityMaxId++;
    player.entity=new Entity(serv.entityMaxId);
    serv.players.push(player);
    serv.uuidToPlayer[player._client.uuid] = player;
  }

  function sendLogin()
  {
    // send init data so client will start rendering world
    player._client.write('login', {
      entityId: player.entity.id,
      levelType: 'default',
      gameMode: 0,
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

  function sendInitialPosition()
  {
    player._client.write('position', {
      x: 6,
      y: 53,
      z: 6,
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
      gameMode: 0
    });
  }

  function fillTabList()
  {
    player._writeOthers('player_info',{
        action: 0,
        data: [{
          UUID: transformUuid(player._client.uuid),
          name: player._client.username,
          properties: [],
          gamemode: 0,
          ping: 1,
          hasDisplayName: true,
          displayName: player._client.username
        }]
      });

    player._client.write('player_info', {
      action: 0,
      data: serv.players
        .map(function (otherPlayer) {
          return {
            UUID: transformUuid(otherPlayer._client.uuid),
            name: otherPlayer._client.username,
            properties: [],
            gamemode: 0,
            ping: 1,
            hasDisplayName: true,
            displayName: otherPlayer._client.username
          };
        })
    });
  }

  function spawn()
  {
    player.getOthers().forEach(function (otherPlayer) {
      var pos = otherPlayer.entity.position;
      player._client.write('named_entity_spawn', {
        entityId: otherPlayer.entity.id,
        playerUUID: transformUuid(otherPlayer._client.uuid),
        x: pos ? pos.x : 6 * 32,
        y: pos ? pos.y : 53 * 32,
        z: pos ? pos.z : 6 * 32,
        yaw: 0,
        pitch: 0,
        currentItem: 0,
        metadata: []
      });
    });

    player._writeOthers('named_entity_spawn',{
      entityId: player.entity.id,
      playerUUID: transformUuid(player._client.uuid),
      x: 6 * 32,
      y: 53 * 32,
      z: 6 * 32,
      yaw: 0,
      pitch: 0,
      currentItem: 0,
      metadata: []
    });
  }

  function announceJoin()
  {
    serv.broadcast(player._client.username + ' joined the game.', "yellow");
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
    sendInitialPosition();

    player.emit("spawned");

    updateTime();
    updateGameState();
    fillTabList();
    spawn();

    announceJoin();


    player._client.on('end', function () {
      serv.broadcast(player._client.username + ' quit the game.', "yellow");
      player.emit('disconnect');
    });


    player._client.on('error', function (error) {
      player.emit('error',error);
    });
  }
}