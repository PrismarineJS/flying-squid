var mc = require('minecraft-protocol');
var states = mc.states;
var settings = require('./config/settings');
var World = require('prismarine-chunk');
var fs = require('fs');
var timeStarted = Math.floor(new Date() / 1000).toString();

var options = {
  motd: settings.motd,
  'max-players': settings.maxPlayers,
  port: settings.port,
  'online-mode': settings.onlineMode,
  reducedDebugInfo: false
};

var world = new World();
for (var x = 0; x < 16;x++) {
  for (var z = 0; z < 16; z++) {
    world.setBlockType(x, 50, z, 2);
    for (var y = 0; y < 256; y++) {
      world.setSkyLight(x, y, z, 15);
    }
  }
}

var server = mc.createServer(options);
	
  if(settings.logging == true) {
    createLog();
  }

server.on('login', function(client) {
  
  broadcast({ text: client.username + ' joined the game.', color: "yellow" });
  var addr = client.socket.remoteAddress + ':' + client.socket.remotePort;
  console.log("[INFO]: " + client.username + ' connected', '(' + addr + ')');
  log("[INFO]: " + client.username + ' connected', '(' + addr + ')');

  client.on('end', function() {
    broadcast({ text: client.username+' left the game.', color: "yellow" });
    console.log("[INFO]: " + client.username+' disconnected', '('+addr+')');
    log("[INFO]: " + client.username+' disconnected', '('+addr+')');
  });

  client.on('error', function(error) {
  	console.log('[ERR] ' + error.stack);
  	log('[ERR]: Client: ' + error.stack);
  });

  // send init data so client will start rendering world
  client.write('login', {
    entityId: client.id,
    levelType: 'default',
    gameMode: 0,
    dimension: 0,
    difficulty: 0,
    reducedDebugInfo: false,
    maxPlayers: server.maxPlayers
  });

    var packetData = {
    x: 0,
    z: 0,
    groundUp: true,
    bitMap: 0xffff,
    chunkData: world.dump()
  };
  client.write('map_chunk', packetData);

    //client.write('map_chunk', packetData);

    client.write('position', {
      x: 6,
      y: 53,
      z: 6,
      yaw: 0,
      pitch: 0,
      flags: 0x00
    });
    console.log("[INFO]: position written, player spawning...");
    log("[INFO]: position written, player spawning...");

    client.write('update_time', {
      age: [0,0],
      time: [0,1]
    });

    client.write('game_state_change', {
      reason: 3,
      gameMode: 1
    });

  client.on([states.PLAY, 'chat'], function(data) {
    var message = '<'+client.username+'>' + ' ' + data.message;
    broadcast(message, client.username);
    console.log("[INFO] " + message);
    log("[INFO] " + message);
  });

  client.on('packet', function(packet) {
    // we don't really need to see the server pass an object every 10nth of a second so I will just disable this
    //console.log("[INFO] " + packet);
    //log("[INFO] " + packet);
  })
});

server.on('error', function(error) {
  console.log('[ERR] ', error.stack);
  log('[ERR]: Server:', error.stack);
});

server.on('listening', function() {
  console.log('[INFO]: Server listening on port', server.socketServer.address().port);
  log('[INFO]: Server listening on port', server.socketServer.address().port);
});

// function broadcast(message, username) {
//   var client, translate;
//   translate = username ? 'chat.type.announcement' : 'chat.type.text';
//   username = username || 'Server';
//   for (var clientId in server.clients) {
//     if (!server.clients.hasOwnProperty(clientId)) continue;

//     client = server.clients[clientId];
//     var msg = {
//       translate: translate,
//       "with": [
//         username
//       ]
//     };
//     if (typeof message === "string") {
//       msg["with"].push(message);
//     } else {
//       Object.keys(message).forEach(function(key) {
//         if (key === "text") {
//           msg["with"].push(message[key]);
//         } else {
//           msg[key] = message[key];
//         }
//       });
//     }

//     client.write('success', { message: JSON.stringify(msg) });
//   }

function createLog() {
	fs.writeFile("logs/" + timeStarted + ".log", "[INFO]: Started logging...\n", function(err, data) {
	if (err) return console.log(err);
	}); 
}

function log(message) {
  if(settings.logging == true) {
	 fs.appendFile("logs/" + timeStarted + ".log", message + "\n", function (err) { });
  }
}

function broadcast(message, exclude, username) {
  var client, translate;
  translate = username ? 'chat.type.announcement' : 'chat.type.text';
  username = username || 'Server';
  for(var clientId in server.clients) {
    if(!server.clients.hasOwnProperty(clientId)) continue;

    client = server.clients[clientId];
    if(client !== exclude) {
      var msg = {
        translate: translate,
        "with": [
         	username,
         	message
        ]
      };
      client.write('chat', { message: JSON.stringify(msg), position: 0 });
    }
  }
}
