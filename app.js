var mc = require('minecraft-protocol');
var states = mc.states;
var World = require('./world');

var options = {
  motd: 'Minecraft Server',
  'max-players': 20,
  port: 25565,
  'online-mode': false,
};

var world = new World();
for (var x = 0; x < 16;x++) {
  for (var z = 0; z < 16; z++) {
    world.put(x, 50, z, "block_data", 2);
  }
}

var server = mc.createServer(options);

server.on('login', function(client) {
  broadcast({ text: client.username + ' joined the game.', color: "yellow" });
  var addr = client.socket.remoteAddress + ':' + client.socket.remotePort;
  console.log(client.username + ' connected', '(' + addr + ')');

  client.on('end', function() {
    broadcast({ text: client.username+' left the game.', color: "yellow" });
    console.log(client.username+' disconnected', '('+addr+')');
  });

  // send init data so client will start rendering world
  client.write(0x01, {
    entityId: client.id,
    levelType: 'default',
    gameMode: 1,
    dimension: 0,
    difficulty: 0,
    maxPlayers: server.maxPlayers
  });
  var chunkBulk = world.packMapChunkBulk([0,0], function(err, packetData) {
    if (err) {
      console.log(err);
      return;
    }
    client.write(0x26, packetData);
    client.write(0x08, {
      x: 6,
      y: 53,
      z: 6,
      yaw: 0,
      pitch: 0,
      onGround: true
    });
    console.log("Written position, player should spawn");
    client.write(0x03, {
      age: [0,0],
      time: [0,1]
    });
    client.write(0x2B, {
      reason: 3,
      gameMode: 1
    });
  });
  client.on([states.PLAY, 0x01], function(data) {
    var message = '<'+client.username+'>' + ' ' + data.message;
    broadcast(message, client.username);
    console.log(message);
  });
  client.on('packet', function(packet) {
    console.log(packet);
  })
});

server.on('error', function(error) {
  console.log('Error:', error);
});

server.on('listening', function() {
  console.log('Server listening on port', server.socketServer.address().port);
});

function broadcast(message, username) {
  var client, translate;
  translate = username ? 'chat.type.announcement' : 'chat.type.text';
  username = username || 'Server';
  for (var clientId in server.clients) {
    if (!server.clients.hasOwnProperty(clientId)) continue;

    client = server.clients[clientId];
    var msg = {
      translate: translate,
      "with": [
        username
      ]
    };
    if (typeof message === "string") {
      msg["with"].push(message);
    } else {
      Object.keys(message).forEach(function(key) {
        if (key === "text") {
          msg["with"].push(message[key]);
        } else {
          msg[key] = message[key];
        }
      });
    }

    client.write(0x02, { message: JSON.stringify(msg) });
  }
}
