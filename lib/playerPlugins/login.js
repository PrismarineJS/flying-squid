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

  function announceLogin()
  {
    player._client.on('chat', function (data) {
      var message = '<' + client.username + '>' + ' ' + data.message;
      playerChat(message, client.username);
      console.log("[INFO] " + message);
      serv.log("[INFO] " + message);
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
    broadcast(player._client.username + ' joined the game.', "yellow");
    var addr = player._client.socket.remoteAddress + ':' + player._client.socket.remotePort;
    console.log("[INFO]: " + player._client.username + ' connected', '(' + addr + ')');
    serv.log("[INFO]: " + player._client.username + ' connected', '(' + addr + ')');
  }


  function playerChat(message, exclude, username) {
    var client;
    //translate = username ? 'chat.type.text' : 'chat.type.text';
    username = username  || '';
    for(var clientId in server.clients) {
      if(!serv._server.clients.hasOwnProperty(clientId)) continue;

      client = serv._server.clients[clientId];
      if(client !== exclude) {
        var msg = {
          "text": username + message
        };
        client.write('chat', { message: JSON.stringify(msg), position: 0 });
      }
    }
  }




  function broadcast(message, color) {
    var client;
    for(var clientId in serv._server.clients) {
      if(!serv._server.clients.hasOwnProperty(clientId)) continue;

      client = serv._server.clients[clientId];
      var msg = {
        "text": message,
        "color": color
      };
      client.write('chat', { message: JSON.stringify(msg), position: 0 });
    }
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

    console.log("[INFO]: position written, player spawning...");
    serv.log("[INFO]: position written, player spawning...");

    updateTime();
    updateGameState();
    announceLogin();
    fillTabList();
    spawn();

    announceJoin();


    var addr = player._client.socket.remoteAddress + ':' + player._client.socket.remotePort;
    player._client.on('end', function () {
      broadcast(player._client.username + ' joined the game.', "yellow");
      console.log("[INFO]: " + player._client.username + ' disconnected', '(' + addr + ')');
      serv.log("[INFO]: " + player._client.username + ' disconnected', '(' + addr + ')');
    });


    player._client.on('error', function (error) {
      console.log('[ERR] ' + error.stack);
      serv.log('[ERR]: Client: ' + error.stack);
    });
  }
}