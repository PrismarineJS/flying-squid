const Vec3 = require('vec3').Vec3

const path = require('path')
const requireIndex = require('../requireindex')
const plugins = requireIndex(path.join(__dirname, '..', 'plugins'))
const Command = require('flying-squid').Command

module.exports.server = function (serv, options) {
  serv._server.on('connection', client =>
    client.on('error', error => serv.emit('clientError', client, error)))

  serv._server.on('login', async (client) => {
    if (client.socket.listeners('end').length === 0) return // TODO: should be fixed properly in nmp instead
    try {
      const player = serv.initEntity('player', null, serv.overworld, new Vec3(0, 0, 0))
      player._client = client

      player.profileProperties = player._client.profile ? player._client.profile.properties : []
      player.commands = new Command({})
      Object.keys(plugins)
        .filter(pluginName => plugins[pluginName].player !== undefined)
        .forEach(pluginName => plugins[pluginName].player(player, serv, options))

      serv.emit('newPlayer', player)
      player.emit('asap')
      await player.login()
    } catch (err) {
      setTimeout(() => { throw err }, 0)
    }
  })
}

module.exports.player = function (player, serv, settings) {
  function addPlayer () {
    player.type = 'player'
    player.health = 20
    player.food = 20
    player.crouching = false // Needs added in prismarine-entity later
    player.op = settings['everybody-op'] // REMOVE THIS WHEN OUT OF TESTING
    player.username = player._client.username
    player.uuid = player._client.uuid
    serv.players.push(player)
    serv.uuidToPlayer[player.uuid] = player
    player.heldItemSlot = 0
    player.loadedChunks = {}
  }

  function sendLogin () {
    // send init data so client will start rendering world
    player._client.write('login', {
      entityId: player.id,
      levelType: 'default',
      gameMode: player.gameMode,
      dimension: 0,
      difficulty: serv.difficulty,
      reducedDebugInfo: false,
      maxPlayers: serv._server.maxPlayers
    })
    player.position = player.spawnPoint.clone()
  }

  function sendChunkWhenMove () {
    player.on('move', () => {
      if (!player.sendingChunks && player.position.distanceTo(player.lastPositionChunkUpdated) > 16) { player.sendRestMap() }
    })
  }

  function updateTime () {
    player._client.write('update_time', {
      age: [0, 0],
      time: [0, serv.time]
    })
  }

  player.setGameMode = gameMode => {
    player.gameMode = gameMode
    player._client.write('game_state_change', {
      reason: 3,
      gameMode: player.gameMode
    })
    serv._writeAll('player_info', {
      action: 1,
      data: [{
        UUID: player.uuid,
        gamemode: player.gameMode
      }]
    })
    player.sendAbilities()
  }

  function fillTabList () {
    player._writeOthers('player_info', {
      action: 0,
      data: [{
        UUID: player.uuid,
        name: player.username,
        properties: player.profileProperties,
        gamemode: player.gameMode,
        ping: player._client.latency
      }]
    })

    player._client.write('player_info', {
      action: 0,
      data: serv.players.map((otherPlayer) => ({
        UUID: otherPlayer.uuid,
        name: otherPlayer.username,
        properties: otherPlayer.profileProperties,
        gamemode: otherPlayer.gameMode,
        ping: otherPlayer._client.latency
      }))
    })
    setInterval(() => player._client.write('player_info', {
      action: 2,
      data: serv.players.map(otherPlayer => ({
        UUID: otherPlayer.uuid,
        ping: otherPlayer._client.latency
      }))
    }), 5000)
  }

  function announceJoin () {
    serv.broadcast(serv.color.yellow + player.username + ' joined the game.')
    player.emit('connected')
  }

  player.waitPlayerLogin = () => {
    const events = ['flying', 'look']
    return new Promise(function (resolve) {
      const listener = () => {
        events.map(event => player._client.removeListener(event, listener))
        resolve()
      }
      events.map(event => player._client.on(event, listener))
    })
  }

  player.login = async () => {
    if (serv.uuidToPlayer[player.uuid]) {
      player.kick('You are already connected')
      return
    }
    if (serv.bannedPlayers[player.uuid]) {
      player.kick(serv.bannedPlayers[player.uuid].reason)
      return
    }
    if (serv.bannedIPs[player._client.socket.remoteAddress]) {
      player.kick(serv.bannedIPs[player._client.socket.remoteAddress].reason)
      return
    }

    addPlayer()
    await player.findSpawnPoint()
    sendLogin()
    player.sendSpawnPosition()
    player.sendSelfPosition()
    player.sendAbilities()
    await player.sendMap()
    player.updateHealth(player.health)

    updateTime()
    fillTabList()
    player.updateAndSpawn()

    announceJoin()
    player.emit('spawned')

    await player.waitPlayerLogin()
    player.sendRestMap()
    sendChunkWhenMove()
  }
}
