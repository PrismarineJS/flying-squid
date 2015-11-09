var Entity=require("prismarine-entity");
var Vec3=require("vec3");

module.exports=inject;

function inject(serv,player)
{
  function addPlayer()
  {
    player.entity=serv.initEntity('player', null, serv.overworld, Vec3(0,0,0));
    player.entity.type = 'player';
    player.entity.player=player;
    player.entity.health = 20;
    player.entity.food = 20;
    player.entity.crouching = false; // Needs added in prismarine-entity later
    player.view=10;
    player.world=serv.overworld;
    player.username=player._client.username;
    serv.players.push(player);
    serv.uuidToPlayer[player._client.uuid] = player;
    player.loadedChunks={};
  }

  function sendPlayersWhenMove()
  {
    player.on("positionChanged",() => {
      if(player.entity.position.distanceTo(player.lastPositionPlayersUpdated)>2*32)
        player.entity.updateAndSpawn();
    });
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
    player.entity.position=player.spawnPoint.toFixedPosition();
  }

  function sendChunkWhenMove()
  {
    player.on("positionChanged", () => {
      if(!player.sendingChunks && player.entity.position.distanceTo(player.lastPositionChunkUpdated)>16*32)
        player.sendRestMap();
    });
  }

  function updateTime()
  {
    player._client.write('update_time', {
      age: [0, 0],
      time: [0, serv.time]
    });
  }

  player.setGameMode = gameMode =>
  {
    player._client.write('game_state_change', {
      reason: 3,
      gameMode: gameMode
    });
    player.gameMode=gameMode;
  };

  function fillTabList()
  {
    if(player._client.profile)
      player.profileProperties=player._client.profile.properties
        .map(property => ({
          name:property.name,
          value:property.value,
          isSigned:true,
          signature:property.signature
        }));
    else
      player.profileProperties=[];

    player._writeOthers('player_info',{
      action: 0,
      data: [{
        UUID: player._client.uuid,
        name: player.username,
        properties: player.profileProperties,
        gamemode: player.gameMode,
        ping: 1
      }]
    });

    player._client.write('player_info', {
      action: 0,
      data: serv.players.map((otherPlayer) => ({
        UUID: otherPlayer._client.uuid,
        name: otherPlayer.username,
        properties: otherPlayer.profileProperties,
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

  player.waitPlayerLogin = () => {
    var events=["flying","look"];
    return new Promise(function(resolve){

      var listener=()=> {
        events.map(event => player._client.removeListener(event,listener));
        resolve();
      };
      events.map(event =>player._client.on(event,listener));
    });
  };


  player.login = async () =>
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
    await player.sendMap();
    player.sendSpawnPosition();
    player.sendPosition();
    player.updateHealth(player.entity.health);


    updateTime();
    player.setGameMode(player.gameMode);
    fillTabList();
    player.entity.updateAndSpawn();

    announceJoin();
    player.emit("spawned");
    sendPlayersWhenMove();

    await player.waitPlayerLogin();
    player.sendRestMap();
    sendChunkWhenMove();
  };
}