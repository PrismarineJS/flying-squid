/* eslint-env mocha */
globalThis.isMocha = true
const fs = require('fs')
const { join } = require('path')
const squid = require('flying-squid')
const settings = require('../config/default-settings.json')
const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const { onceWithTimeout } = require('../src/lib/utils')
const expect = require('expect').default

const DEBUG_PACKET_IO = false

function assertPosEqual (actual, expected, precision = 1) {
  expect(actual.distanceTo(expected)).toBeLessThan(precision)
}

function waitForPromises (map, timeout) {
  const promises = Object.entries(map)
  let count = promises.length
  console.log('🤚 Waiting for', promises.map(([name]) => name))
  return new Promise((resolve, reject) => {
    if (timeout) setTimeout(() => reject(new Error('Timeout waiting for promises')), timeout)
    for (const [name, promise] of promises) {
      promise.then(() => {
        count--
        console.log('👍 Promise', name, 'resolved')
        if (count === 0) {
          resolve()
        }
      })
    }
  })
}

const { once } = require('events')

squid.testedVersions.forEach((testedVersion, i) => {
  const registry = require('prismarine-registry')(testedVersion)
  const version = registry.version

  const Item = require('prismarine-item')(testedVersion)

  describe('server with mineflayer connection ' + testedVersion + 'v', () => {
    /** @type {import('mineflayer').Bot} */
    let bot
    /** @type {import('mineflayer').Bot} */
    let bot2
    let serv
    let entityName

    async function onGround (bot) {
      await new Promise((resolve) => {
        const l = () => {
          if (bot.entity.onGround) {
            bot.removeListener('move', l)
            resolve()
          }
        }
        bot.on('move', l)
      })
    }

    async function waitMessage (bot, message) {
      console.log('Waiting for message', [message])
      onceWithTimeout(bot, 'message', 5000, (msg) => {
        console.log('*msg', msg)
        return msg.toString() === message
      })
    }

    // Clear the world dir before each test
    const worldFolder = 'world/test_' + testedVersion
    const dir = join(__dirname, '../', worldFolder)
    console.log('Clearing world dir', dir)
    fs.rmSync(dir, { recursive: true, force: true })

    beforeEach(async function () {
      console.log('🔻 Running test: ' + this.currentTest.title)
      const options = settings
      options['online-mode'] = false
      options['everybody-op'] = true
      options.port = 0
      options['view-distance'] = 2
      options.worldFolder = undefined
      options.logging = false
      options.version = version.minecraftVersion
      options.generation = { // TODO: fix block tests failing at random without manually specifying seed
        name: 'diamond_square',
        options: {
          seed: 2116746182
        }
      }

      options.worldFolder = worldFolder
      options.debug = console.log
      serv = squid.createMCServer(options)
      if (registry.supportFeature('entityCamelCase')) {
        entityName = 'EnderDragon'
      } else {
        entityName = 'ender_dragon'
      }

      console.log('[test] Waiting for server to start')
      const [port] = await once(serv, 'listening')
      await serv.waitForReady()
      console.log('[test] Server is started on', port, version.minecraftVersion)

      bot = mineflayer.createBot({
        host: 'localhost',
        port,
        username: 'bot',
        version: version.minecraftVersion
      })
      bot2 = mineflayer.createBot({
        host: 'localhost',
        port,
        username: 'bot2',
        version: version.minecraftVersion
      })

      if (DEBUG_PACKET_IO) {
        logClientboundEvents(serv, '')
        logBotEvents(serv, bot, 1)
        logBotEvents(serv, bot2, 2)
      }

      await waitForPromises({
        'bot spawn': once(bot, 'spawn'),
        'bot2 spawn': once(bot2, 'spawn'),
        'bot chunks': waitForReady(bot),
        'bot2 chunks': waitForReady(bot2)
      })
      bot.entity.onGround = false
      bot2.entity.onGround = false

      // log what the bot is standing on for debugging
      const bot1StandingOn = bot.blockAt(bot.entity.position.floored().offset(0, -1, 0))
      const bot2StandingOn = bot2.blockAt(bot2.entity.position.floored().offset(0, -1, 0))
      console.log('bot1 is standing on', bot1StandingOn)
      console.log('bot2 is standing on', bot2StandingOn)
    })

    function waitForReady (bot) {
      const viewDistance = 2
      const testExpectedNoChunks = (viewDistance * 2) * (viewDistance * 2)
      return new Promise((resolve) => {
        let recvChunks = 0
        function onColumnLoad () {
          recvChunks++
          if (recvChunks === testExpectedNoChunks) {
            bot.removeListener('chunkColumnLoad', onColumnLoad)
            resolve()
          }
        }
        bot.on('chunkColumnLoad', onColumnLoad)
      })
    }

    afterEach(async () => {
      console.log('Quitting server...')
      await serv.quit()
      console.log('Quit server!')
    })

    describe('actions', () => {
      // Log the name of the test being run
      beforeEach(function () {
        console.log('🔻 Running actions test: ' + this.currentTest.title)
      })

      it('can dig', async () => {
        const pos = bot.entity.position.offset(0, -1, 0).floored()
        // Set a dirt block below the bot so we can easily dig
        bot.chat(`/setblock ${pos.x} ${pos.y} ${pos.z} dirt`)
        await onceWithTimeout(bot, `blockUpdate:${pos}`, 4000)
        console.log('Block at', pos, bot.blockAt(pos))

        const p = onceWithTimeout(bot2, 'blockUpdate', 4000, (old, now) => {
          return now.type === 0
        })
        await bot.dig(bot.blockAt(pos))
        console.log('Digging...')

        const [, newBlock] = await p
        console.log('Dug.', newBlock)
        assertPosEqual(newBlock.position, pos)
        expect(newBlock.type).toEqual(0)
      })

      it('can place a block', async () => {
        const pos = bot.entity.position.offset(0, -2, 0).floored()
        const digPromise = once(bot2, 'blockUpdate')
        bot.dig(bot.blockAt(pos))

        console.log(' ✔️ dug block at', pos)

        let [, newBlock] = await digPromise
        assertPosEqual(newBlock.position, pos)
        expect(newBlock.type).toEqual(0)

        const invPromise = new Promise((resolve) => {
          bot.inventory.on('updateSlot', (slot, oldItem, newItem) => {
            if (slot === 36 && newItem && newItem.type === 1) { resolve() }
          })
        })
        bot.creative.setInventorySlot(36, new Item(1, 1))
        await invPromise

        console.log(' ✔️ updated inventory')

        const placePromise = once(bot2, 'blockUpdate', { array: true })
        bot.placeBlock(bot.blockAt(pos.offset(0, -1, 0)), new Vec3(0, 1, 0));
        [, newBlock] = await placePromise
        console.log(' ✔️ placed block at', pos)
        assertPosEqual(newBlock.position, pos)
        expect(newBlock.type).toEqual(1)
      })

      it('can open and close a chest', async () => {
        const chestId = registry.blocksByName.chest.id
        const [x, y, z] = [1, 2, 3]

        const states = {
          open: {
            location: { x, y, z },
            byte1: 1,
            byte2: 1, // open
            blockId: chestId
          },
          closed: {
            location: { x, y, z },
            byte1: 1,
            byte2: 0, // closed
            blockId: chestId
          }
        }

        const setBlockPromise = once(bot, 'blockUpdate')
        bot.chat(`/setblock ${x} ${y} ${z} ${chestId} 2`) // place a chest facing north
        await setBlockPromise

        const openPromise1 = once(bot._client, 'block_action', { array: true })
        const openPromise2 = once(bot2._client, 'block_action', { array: true })
        bot.chat(`/setblockaction ${x} ${y} ${z} 1 1`) // open the chest
        const [blockActionOpen] = await openPromise1
        const [blockActionOpen2] = await openPromise2
        expect(blockActionOpen).toEqual(states.open)
        expect(blockActionOpen2).toEqual(states.open)

        const closePromise1 = once(bot._client, 'block_action', { array: true })
        const closePromise2 = once(bot2._client, 'block_action', { array: true })
        bot.chat(`/setblockaction ${x} ${y} ${z} 1 0`) // close the chest
        const [blockActionClosed] = await closePromise1
        const [blockActionClosed2] = await closePromise2
        expect(blockActionClosed).toEqual(states.closed)
        expect(blockActionClosed2).toEqual(states.closed)
      })
    })

    describe('commands', () => {
      beforeEach(function () {
        console.log('🔻 Running commands test: ' + this.currentTest.title)
      })

      it('has an help command', async () => {
        bot.chat('/help')
        await once(bot, 'message')
      })
      it('can use /particle', async () => {
        bot.chat('/particle 5 10 100 100 100')
        await once(bot._client, 'world_particles')
      })
      it('can use /playsound', async () => {
        bot.chat('/playsound ambient.weather.rain')
        // TODO: why are there 2 mineflayer events for this as opposed to one with extra fields?
        await once(bot, serv.supportFeature('removedNamedSoundEffectPacket')
          ? 'hardcodedSoundEffectHeard' // 1.19.3+
          : 'soundEffectHeard'
        )
      })

      function waitDragon () {
        return new Promise((resolve) => {
          const listener = (entity) => {
            if (entity.name === entityName) {
              bot.removeListener('entitySpawn', listener)
              resolve()
            }
          }
          bot.on('entitySpawn', listener)
        })
      }

      it('can use /summon', async () => {
        bot.chat('/summon ' + entityName)
        await waitDragon()
      })
      it('can use /kill', async () => {
        bot.chat('/summon ' + entityName)
        await waitDragon()
        bot.chat('/kill @e[type=' + entityName + ']')
        const [entity] = await once(bot, 'entityDead')
        expect(entity.name).toEqual(entityName)
      })
      describe('can use /tp', () => {
        it('can tp myself', async () => {
          bot.chat('/tp 2 3 4')
          await once(bot, 'forcedMove')
          assertPosEqual(bot.entity.position, new Vec3(2, 3, 4))
        })
        it('can tp somebody else', async () => {
          bot.chat('/tp bot2 2 3 4')
          await once(bot2, 'forcedMove')
          assertPosEqual(bot2.entity.position, new Vec3(2, 3, 4))
        })
        it('can tp to somebody else', async () => {
          await onGround(bot)
          bot.chat('/tp bot2 bot')
          await once(bot2, 'forcedMove')
          assertPosEqual(bot2.entity.position, bot.entity.position)
        })
        it('can tp with relative positions', async () => {
          const initialPosition = bot.entity.position.clone()
          bot.chat('/tp ~1 ~-2 ~3')
          await once(bot, 'forcedMove')
          assertPosEqual(bot.entity.position, initialPosition.offset(1, -2, 3), 2)
        })
        it('can tp somebody else with relative positions', async () => {
          const initialPosition = bot2.entity.position.clone()
          bot.chat('/tp bot2 ~1 ~-2 ~3')
          await once(bot2, 'forcedMove')
          assertPosEqual(bot2.entity.position, initialPosition.offset(1, -2, 3), 2)
        })
      })
      it('can use /deop', async () => {
        bot.chat('/deop bot')
        await waitMessage(bot, '§7§o[Server: Deopped bot]')
        bot.chat('/op bot')
        await waitMessage(bot, 'You do not have permission to use this command')
        serv.getPlayer('bot').op = true
      })
      it('can use /setblock', async () => {
        const chestId = registry.blocksByName.chest.id
        const p = once(bot, 'blockUpdate:' + new Vec3(1, 2, 3), { array: true })
        bot.chat(`/setblock 1 2 3 ${chestId} 0`)
        const [, newBlock] = await p
        expect(newBlock.type).toEqual(chestId)
      })
      it('can use /xp', async () => {
        bot.chat('/xp 100')
        await once(bot, 'experience')
        expect(bot.experience.points).toEqual(100)
      })
      it('can use /give', async () => {
        bot.chat('/give bot2 1 1')
        await once(bot2.inventory, 'updateSlot')
        expect(bot2.inventory.slots[36].type).toEqual(1)
      })
      it.skip('can use tabComplete', async () => {
        const data = await bot.tabComplete('/give ')
        expect(data).toEqual(['bot', 'bot2', '@p', '@a', '@e', '@r'])
      })

      function waitMessagePromise (message) {
        return new Promise((resolve) => {
          const listener = (msg) => {
            const text = msg.extra?.[0].text ?? msg.text
            if (text === message) {
              bot.removeListener('message', listener)
              resolve()
            }
          }
          bot.on('message', listener)
        })
      }

      it('can use /banlist, /ban, /pardon', async () => {
        bot.chat('/banlist')
        await waitMessagePromise('There are 0 total banned players')
        bot.chat('/ban bot2')
        await waitMessagePromise('bot2 was banned')
        bot.chat('/banlist')
        await waitMessagePromise('There are 1 total banned players:')
        bot.chat('/pardon bot2')
        await waitMessagePromise('bot2 is unbanned')
        bot.chat('/banlist')
        await waitMessagePromise('There are 0 total banned players')
      })
    }).timeout(120 * 1000)
  }).timeout(100 * 1000)
})

BigInt.prototype.toJSON = function () { // eslint-disable-line no-extend-native
  return this.toString()
}
const SKIP_PACKETS = ['update_time']
function logBotEvents (serv, bot, prefix) {
  bot._client.on('packet', (data, meta) => {
    if (serv.isReady && !SKIP_PACKETS.includes(meta.name)) {
      console.log(prefix, 'Packet', meta, JSON.stringify(data)?.slice(0, 60))
    }
  })
  bot._client.on('state', (now, old) => {
    console.log(prefix, '~ Client State Change', now, old)
  })
  bot.on('kicked', (...a) => {
    console.warn(prefix, '*Bot kicked', a)
  })
  bot.on('error', (err) => {
    console.error(prefix, '*Bot error', err)
    process.exit(1)
  })
  bot._client.socket.on('error', (err) => {
    console.error(prefix, '*SOCKET Bot error', err)
    process.exit(1)
  })
  bot.on('end', (reason) => {
    console.log(prefix, '*Bot END', reason)
  })
  const oldWrite = bot._client.write
  bot._client.write = (name, payload) => {
    if (SKIP_PACKETS.includes(name)) return
    console.log(prefix, 'C->S', [name], JSON.stringify(payload)?.slice(0, 60))
    return oldWrite.call(bot._client, name, payload)
  }
}
function logClientboundEvents (serv, prefix = '') {
  serv._server.on('connection', (client) => {
    client.on('state', (now, old) => {
      console.log(prefix, '~ Server State Change', now, old)
    })
    const oldWrite = client.write
    client.write = (name, param) => {
      if (SKIP_PACKETS.includes(name)) return
      console.log(prefix, 'S->C', client.username, [name], JSON.stringify(param)?.slice(0, 60))
      return oldWrite.call(client, name, param)
    }
  })
}
