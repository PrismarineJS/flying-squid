const Vec3 = require('vec3').Vec3
const crypto = require('crypto')
const playerDat = require('../playerDat')
const convertInventorySlotId = require('../convertInventorySlotId')
const plugins = require('./index')

module.exports.server = function (serv, options) {
  serv._server.on('connection', (client) => {
    client.on('error', error => serv.emit('clientError', client, error))
  })

  serv._server.on('login', async (client) => {
    if (!serv.pluginsReady) {
      client.end('Server is still starting! Please wait before reconnecting.')
      serv.info(`[${client.socket.remoteAddress}] ${client.username} (${client.uuid}) disconnected as server is still starting`)
      return
    }
    serv.debug?.(`[login] ${client.socket?.remoteAddress} - ${client.username} (${client.uuid}) connected`, client.version, client.protocolVersion)
    try {
      const player = serv.initEntity('player', null, serv.overworld, new Vec3(0, 0, 0))
      player._client = client

      player.profileProperties = player._client.profile ? player._client.profile.properties : []

      for (const plugin of plugins.builtinPlugins) plugin.player?.(player, serv, options)

      serv.emit('newPlayer', player)
      player.emit('asap')
      await player.login()
    } catch (err) {
      setTimeout(() => { throw err }, 0)
    }
  })

  serv.hashedSeed = [0, 0]
  serv.on('seed', (seed) => {
    const seedBuf = Buffer.allocUnsafe(8)
    seedBuf.writeBigInt64LE(BigInt(seed))
    const seedHash = crypto.createHash('sha256').update(seedBuf).digest().subarray(0, 8).readBigInt64LE()
    serv.hashedSeed = [Number(BigInt.asIntN(64, seedHash) < 0 ? -(BigInt.asUintN(32, (-seedHash) >> 32n) + 1n) : seedHash >> 32n), Number(BigInt.asIntN(32, seedHash & (2n ** 32n - 1n)))] // convert BigInt to mcpc long
  })
}

module.exports.player = async function (player, serv, settings) {
  const Item = require('prismarine-item')(serv.registry)

  let playerData

  async function addPlayer () {
    player.type = 'player'
    player.crouching = false // Needs added in prismarine-entity later
    player.op = settings['everybody-op'] // REMOVE THIS WHEN OUT OF TESTING
    player.username = player._client.username
    player.uuid = player._client.uuid

    await player.findSpawnPoint()

    playerData = await playerDat.read(player.uuid, player.spawnPoint, settings.worldFolder)
    Object.keys(playerData.player).forEach(k => { player[k] = playerData.player[k] })

    serv.players.push(player)
    serv.uuidToPlayer[player.uuid] = player
    player.loadedChunks = {}
  }

  function updateInventory () {
    playerData.inventory.forEach((item) => {
      const itemName = item.id.value.slice(10) // skip game brand prefix
      const theItem = serv.registry.itemsByName[itemName] || serv.registry.blocksByName[itemName]

      let newItem
      if (serv.registry.version['<']('1.13')) newItem = new Item(theItem.id, item.Count.value, item.Damage.value)
      else if (item.tag) newItem = new Item(theItem.id, item.Count.value, item.tag)
      else newItem = new Item(theItem.id, item.Count.value)

      const slot = convertInventorySlotId.fromNBT(item.Slot.value)
      player.inventory.updateSlot(slot, newItem)
    })
    player._client.write('held_item_slot', {
      slot: player.heldItemSlot
    })
  }

  function sendLogin () {
    // send init data so client will start rendering world
    player._client.write('login', {
      ...serv.registry.loginPacket,
      entityId: player.id,
      levelType: 'default',
      gameMode: player.gameMode,
      previousGameMode: 0,
      worldNames: Object.values(serv.dimensionNames),
      dimensionCodec: serv.registry.loginPacket?.dimensionCodec,
      worldName: serv.dimensionNames[0],
      dimension: (serv.supportFeature('dimensionIsAString') || serv.supportFeature('dimensionIsAWorld')) ? serv.registry.loginPacket.dimension : 0,
      hashedSeed: serv.hashedSeed,
      difficulty: serv.difficulty,
      viewDistance: settings['view-distance'],
      reducedDebugInfo: false,
      maxPlayers: Math.min(255, serv._server.maxPlayers),
      enableRespawnScreen: true,
      isDebug: false,
      isFlat: settings.generation?.name === 'superflat'
    })
    if (serv.supportFeature('difficultySentSeparately')) {
      player._client.write('difficulty', {
        difficulty: serv.difficulty,
        difficultyLocked: false
      })
    }
  }

  function sendChunkWhenMove () {
    player.on('move', () => {
      if (!player.sendingChunks && player.position.distanceTo(player.lastPositionChunkUpdated) > 16) { player.worldSendRestOfChunks() }
      if (!serv.supportFeature('updateViewPosition')) {
        return
      }
      const chunkX = Math.floor(player.position.x / 16)
      const chunkZ = Math.floor(player.position.z / 16)
      const lastChunkX = Math.floor(player.lastPositionPlayersUpdated.x / 16)
      const lastChunkZ = Math.floor(player.lastPositionPlayersUpdated.z / 16)
      if (chunkX !== lastChunkX || chunkZ !== lastChunkZ) {
        player._client.write('update_view_position', {
          chunkX,
          chunkZ
        })
      }
    })
  }

  function updateTime () {
    player._client.write('update_time', {
      age: [0, 0],
      time: [0, serv.time]
    })
  }

  // TODO: The structure of player_info changes alot between versions and is messy
  // https://github.com/PrismarineJS/minecraft-data/pull/948 will fix some of it but
  // merging that will also require updating mineflayer. In the meantime we can skip this
  // packet in 1.19+ as it also requires some chat signing key logic to be implemented

  serv._sendPlayerEventLeave = function (player) {
    if (serv.registry.version['>=']('1.19')) return
    player._writeOthers('player_info', {
      action: 4,
      data: [{
        UUID: player.uuid,
        uuid: player.uuid // 1.19.3+
      }]
    })
  }

  serv._sendPlayerEventUpdateGameMode = function (player) {
    if (serv.registry.version['>=']('1.19')) return
    serv._writeAll('player_info', {
      action: 1,
      data: [{
        UUID: player.uuid,
        gamemode: player.gameMode
      }]
    })
  }

  player.setGameMode = (gameMode) => {
    if (gameMode !== player.gameMode) player.prevGameMode = player.gameMode
    player.gameMode = gameMode
    player._client.write('game_state_change', {
      reason: 3,
      gameMode: player.gameMode
    })
    serv._sendPlayerEventUpdateGameMode(player)
    player.sendAbilities()
  }

  serv._sendPlayerEventNewJoin = function (player) {
    if (serv.registry.version['>=']('1.19')) return
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
  }

  serv._sendPlayerList = function (toPlayer) {
    if (serv.registry.version['>=']('1.19')) return
    toPlayer._writeOthers('player_info', {
      action: 0,
      data: serv.players.map((otherPlayer) => ({
        UUID: otherPlayer.uuid,
        name: otherPlayer.username,
        properties: otherPlayer.profileProperties,
        gamemode: otherPlayer.gameMode,
        ping: otherPlayer._client.latency
      }))
    })
  }

  function fillTabList () {
    serv._sendPlayerList(player)
    if (serv.registry.version['<=']('1.18')) {
      setInterval(() => player._client.write('player_info', {
        action: 2,
        data: serv.players.map(otherPlayer => ({
          UUID: otherPlayer.uuid,
          ping: otherPlayer._client.latency
        }))
      }), 5000)
    }
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

  function sendStatus () {
    player._client.write('held_item_slot', { slot: 0 })
    player._client.write('entity_status', {
      entityId: player.id,
      entityStatus: 23
    })
    player._client.write('entity_status', {
      entityId: player.id,
      entityStatus: 24
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
    if (serv.bannedIPs[player._client.socket?.remoteAddress]) {
      player.kick(serv.bannedIPs[player._client.socket?.remoteAddress].reason)
      return
    }

    await addPlayer()
    sendLogin()
    sendStatus()
    player.sendSpawnPosition()
    player.sendSelfPosition()
    player.sendAbilities()
    await player.worldSendInitialChunks()
    player.setXp(player.xp)
    updateInventory()

    updateTime()
    fillTabList()
    player.updateAndSpawn()

    announceJoin()
    // mineflayer emits spawn event on health update so it needs to be done as last step
    player.updateHealth(player.health)
    player.emit('spawned')

    await player.waitPlayerLogin()
    player.worldSendRestOfChunks()
    sendChunkWhenMove()

    player.save()
  }
}
