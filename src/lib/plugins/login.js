/* global BigInt */
const Vec3 = require('vec3').Vec3

const crypto = require('crypto')
const playerDat = require('../playerDat')
const convertInventorySlotId = require('../convertInventorySlotId')
const plugins = require('./index')

module.exports.server = function (serv, options) {
  serv._server.on('connection', client =>
    client.on('error', error => serv.emit('clientError', client, error)))

  serv._server.on('login', async (client) => {
    if (client.socket?.listeners('end').length === 0) return // TODO: should be fixed properly in nmp instead
    if (!serv.pluginsReady) {
      client.end('Server is still starting! Please wait before reconnecting.')
      return
    }
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
  const Item = require('prismarine-item')(settings.version)
  const mcData = require('minecraft-data')(settings.version)

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
      const theItem = mcData.itemsByName[itemName] || mcData.blocksByName[itemName]

      let newItem
      if (mcData.version['<']('1.13')) newItem = new Item(theItem.id, item.Count.value, item.Damage.value)
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
      entityId: player.id,
      levelType: 'default',
      gameMode: player.gameMode,
      previousGameMode: player.prevGameMode,
      worldNames: Object.values(serv.dimensionNames),
      dimensionCodec,
      worldName: serv.dimensionNames[0],
      dimension: serv.supportFeature('dimensionIsAString') ? serv.dimensionNames[0] : 0,
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
      if (!player.sendingChunks && player.position.distanceTo(player.lastPositionChunkUpdated) > 16) { player.sendRestMap() }
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

  player.setGameMode = (gameMode) => {
    if (gameMode !== player.gameMode) player.prevGameMode = player.gameMode
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
    if (serv.bannedIPs[player._client.socket?.remoteAddress]) {
      player.kick(serv.bannedIPs[player._client.socket?.remoteAddress].reason)
      return
    }

    await addPlayer()
    sendLogin()
    player.sendSpawnPosition()
    player.sendSelfPosition()
    player.sendAbilities()
    await player.sendMap()
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
    player.sendRestMap()
    sendChunkWhenMove()

    player.save()
  }

  const dimensionCodec = { // Dumped from a vanilla 1.16.1 server, as these are hardcoded constants
    type: 'compound',
    name: '',
    value: {
      dimension: {
        type: 'list',
        value: {
          type: 'compound',
          value: [
            {
              name: {
                type: 'string',
                value: 'minecraft:overworld'
              },
              bed_works: {
                type: 'byte',
                value: 1
              },
              shrunk: {
                type: 'byte',
                value: 0
              },
              piglin_safe: {
                type: 'byte',
                value: 0
              },
              has_ceiling: {
                type: 'byte',
                value: 0
              },
              has_skylight: {
                type: 'byte',
                value: 1
              },
              infiniburn: {
                type: 'string',
                value: 'minecraft:infiniburn_overworld'
              },
              ultrawarm: {
                type: 'byte',
                value: 0
              },
              ambient_light: {
                type: 'float',
                value: 0
              },
              logical_height: {
                type: 'int',
                value: 256
              },
              has_raids: {
                type: 'byte',
                value: 1
              },
              natural: {
                type: 'byte',
                value: 1
              },
              respawn_anchor_works: {
                type: 'byte',
                value: 0
              }
            }, /*, minecraft:overworld_caves is not implemented in flying-squid yet            {
              "name": {
                "type": "string",
                "value": "minecraft:overworld_caves"
              },
              "bed_works": {
                "type": "byte",
                "value": 1
              },
              "shrunk": {
                "type": "byte",
                "value": 0
              },
              "piglin_safe": {
                "type": "byte",
                "value": 0
              },
              "has_ceiling": {
                "type": "byte",
                "value": 1
              },
              "has_skylight": {
                "type": "byte",
                "value": 1
              },
              "infiniburn": {
                "type": "string",
                "value": "minecraft:infiniburn_overworld"
              },
              "ultrawarm": {
                "type": "byte",
                "value": 0
              },
              "ambient_light": {
                "type": "float",
                "value": 0
              },
              "logical_height": {
                "type": "int",
                "value": 256
              },
              "has_raids": {
                "type": "byte",
                "value": 1
              },
              "natural": {
                "type": "byte",
                "value": 1
              },
              "respawn_anchor_works": {
                "type": "byte",
                "value": 0
              }
            } */
            {
              infiniburn: {
                type: 'string',
                value: 'minecraft:infiniburn_nether'
              },
              ultrawarm: {
                type: 'byte',
                value: 1
              },
              logical_height: {
                type: 'int',
                value: 128
              },
              natural: {
                type: 'byte',
                value: 0
              },
              name: {
                type: 'string',
                value: 'minecraft:the_nether'
              },
              bed_works: {
                type: 'byte',
                value: 0
              },
              fixed_time: {
                type: 'long',
                value: [
                  0,
                  18000
                ]
              },
              shrunk: {
                type: 'byte',
                value: 1
              },
              piglin_safe: {
                type: 'byte',
                value: 1
              },
              has_skylight: {
                type: 'byte',
                value: 0
              },
              has_ceiling: {
                type: 'byte',
                value: 1
              },
              ambient_light: {
                type: 'float',
                value: 0.1
              },
              has_raids: {
                type: 'byte',
                value: 0
              },
              respawn_anchor_works: {
                type: 'byte',
                value: 1
              }
            }/*, minecraft:the_end is not implemented in flying-squid yet
            {
              "infiniburn": {
                "type": "string",
                "value": "minecraft:infiniburn_end"
              },
              "ultrawarm": {
                "type": "byte",
                "value": 0
              },
              "logical_height": {
                "type": "int",
                "value": 256
              },
              "natural": {
                "type": "byte",
                "value": 0
              },
              "name": {
                "type": "string",
                "value": "minecraft:the_end"
              },
              "bed_works": {
                "type": "byte",
                "value": 0
              },
              "fixed_time": {
                "type": "long",
                "value": [
                  0,
                  6000
                ]
              },
              "shrunk": {
                "type": "byte",
                "value": 0
              },
              "piglin_safe": {
                "type": "byte",
                "value": 0
              },
              "has_skylight": {
                "type": "byte",
                "value": 0
              },
              "has_ceiling": {
                "type": "byte",
                "value": 0
              },
              "ambient_light": {
                "type": "float",
                "value": 0
              },
              "has_raids": {
                "type": "byte",
                "value": 1
              },
              "respawn_anchor_works": {
                "type": "byte",
                "value": 0
              }
            } */
          ]
        }
      }
    }
  }
}
