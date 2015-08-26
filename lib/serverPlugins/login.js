module.exports=inject;

function transformUuid(s)
{
  return s.split("-").map(function(item) { return parseInt(item, 16); });
}


function inject(serv)
{
  serv.login=login;

  function addPlayer(client)
  {
    serv.entityMaxId++;
    client.id = serv.entityMaxId;
    serv.playersConnected.push(client);
    console.log(client.uuid);
    serv.uuidToPlayer[client.uuid] = client;
  }

  function sendLogin(client)
  {
    // send init data so client will start rendering world
    client.write('login', {
      entityId: client.id,
      levelType: 'default',
      gameMode: 0,
      dimension: 0,
      difficulty: 0,
      reducedDebugInfo: false,
      maxPlayers: serv._server.maxPlayers
    });
  }
  function sendMap(client)
  {
    client.write('map_chunk', {
      x: 0,
      z: 0,
      groundUp: true,
      bitMap: 0xffff,
      chunkData: serv.world.dump()
    });
  }

  function sendInitialPosition(client)
  {
    client.write('position', {
      x: 6,
      y: 53,
      z: 6,
      yaw: 0,
      pitch: 0,
      flags: 0x00
    });
  }

  function updateTime(client)
  {
    client.write('update_time', {
      age: [0, 0],
      time: [0, 1]
    });
  }

  function updateGameState(client)
  {
    client.write('game_state_change', {
      reason: 3,
      gameMode: 0
    });
  }

  function announceLogin(client)
  {
    client.on('chat', function (data) {
      var message = '<' + client.username + '>' + ' ' + data.message;
      playerChat(message, client.username);
      console.log("[INFO] " + message);
      serv.log("[INFO] " + message);
    });
  }

  function fillTabList(client)
  {
    serv.otherClients(client).forEach(function (otherClient) {
      otherClient.write('player_info', {
        action: 0,
        data: [{
          UUID: transformUuid(client.uuid),
          name: client.username,
          properties: [],
          gamemode: 0,
          ping: 1,
          hasDisplayName: true,
          displayName: client.username
        }]
      });
    });

    client.write('player_info', {
      action: 0,
      data: serv.playersConnected
        .map(function (otherClient) {
          return {
            UUID: transformUuid(otherClient.uuid),
            name: otherClient.username,
            properties: [],
            gamemode: 0,
            ping: 1,
            hasDisplayName: true,
            displayName: otherClient.username
          };
        })
    });
  }

  function spawn(client)
  {
    serv.otherClients(client).forEach(function (otherClient) {
      var pos = serv.uuidToPlayer[otherClient.uuid].position;
      client.write('named_entity_spawn', {
        entityId: otherClient.id,
        playerUUID: transformUuid(otherClient.uuid),
        x: pos ? pos.x : 6 * 32,
        y: pos ? pos.y : 53 * 32,
        z: pos ? pos.z : 6 * 32,
        yaw: 0,
        pitch: 0,
        currentItem: 0,
        metadata: []
      });
      otherClient.write('named_entity_spawn', {
        entityId: client.id,
        playerUUID: transformUuid(client.uuid),
        x: 6 * 32,
        y: 53 * 32,
        z: 6 * 32,
        yaw: 0,
        pitch: 0,
        currentItem: 0,
        metadata: []
      });
    });
  }

  function announceJoin(client)
  {
    broadcast(client.username + ' joined the game.', "yellow");
    var addr = client.socket.remoteAddress + ':' + client.socket.remotePort;
    console.log("[INFO]: " + client.username + ' connected', '(' + addr + ')');
    serv.log("[INFO]: " + client.username + ' connected', '(' + addr + ')');
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


  function login(client)
  {
    if (serv.uuidToPlayer[client.uuid]) {
      client.end("You are already connected");
      return;
    }
    addPlayer(client);
    sendLogin(client);
    sendMap(client);
    sendInitialPosition(client);

    console.log("[INFO]: position written, player spawning...");
    serv.log("[INFO]: position written, player spawning...");

    updateTime(client);
    updateGameState(client);
    announceLogin(client);
    fillTabList(client);
    spawn(client);

    announceJoin(client);


    var addr = client.socket.remoteAddress + ':' + client.socket.remotePort;
    client.on('end', function () {
      broadcast(client.username + ' joined the game.', "yellow");
      console.log("[INFO]: " + client.username + ' disconnected', '(' + addr + ')');
      serv.log("[INFO]: " + client.username + ' disconnected', '(' + addr + ')');
    });


    client.on('error', function (error) {
      console.log('[ERR] ' + error.stack);
      serv.log('[ERR]: Client: ' + error.stack);
    });
  }
}