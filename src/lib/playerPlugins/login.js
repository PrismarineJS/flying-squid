var Entity=require("prismarine-entity");
var Vec3=require("vec3");

module.exports=inject;

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
    player.view=8;
    player.world=serv.overworld;
    player.username=player._client.username;
    serv.players.push(player);
    serv.uuidToPlayer[player._client.uuid] = player;
    player.loadedChunks={};
  }

  function toFixedPosition(p)
  {
    return p.scaled(32).floored();
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
    player.entity.position=toFixedPosition(player.spawnPoint);
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

    player.on("positionChanged",function(){
      if(!player.sendingChunks && player.entity.position.distanceTo(player.lastPositionChunkUpdated)>16*32)
      {
        player.sendingChunks=true;
        player.sendNearbyChunks(player.view)
          .then(() => player.sendingChunks=false)
          .catch((err)=> setTimeout(function(){throw err;},0));
      }
    });
    player.on("teleport", function() {
      player.sendingChunks=true;
      player.sendNearbyChunks(player.view)
        .then(() => player.sendingChunks=false)
        .catch((err)=> setTimeout(function(){throw err;},0));
    });
  }

  function sendSpawnPosition()
  {
    console.log("setting spawn at "+player.spawnPoint);
    player._client.write('spawn_position',{
      "location":player.spawnPoint
    });
  }

  function updateTime()
  {
    player._client.write('update_time', {
      age: [0, 0],
      time: [0, serv.time]
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
        UUID: player._client.uuid,
        name: player.username,
        properties: [],
        gamemode: player.gameMode,
        ping: 1
      }]
    });

    player._client.write('player_info', {
      action: 0,
      data: serv.players.map((otherPlayer) => ({
        UUID: otherPlayer._client.uuid,
        name: otherPlayer.username,
        properties: [],
        gamemode: otherPlayer.gameMode,
        ping: 1
      }))
    });
  }

  function announceJoin()
  {
    serv.broadcast(player.username + ' joined the game.', "yellow");
    player.emit("connected");
  }

  async function login()
  { 
    if (serv.uuidToPlayer[player._client.uuid]) {
      player._client.end("You are already connected");
      return;
    }
    if (serv.bannedPlayers[player._client.uuid]) {
      player.kick(serv.bannedPlayers[player._client.uuid].reason);
      return;
    }

    addPlayer();
    sendLogin();
    await sendMap();
    sendSpawnPosition();
    player.updateHealth(player.entity.health);

    player.emit("spawned");

    updateTime();
    setGameMode(player.gameMode);
    fillTabList();

    player.spawn();
    announceJoin();

    setTimeout(sendRestMap,100);
  }

  player.setGameMode=setGameMode;
  player.login=login;
}