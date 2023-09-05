/* eslint-env mocha */

const squid = require('flying-squid')
const settings = require('../config/default-settings.json')
const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const expect = require('expect').default

function assertPosEqual (actual, expected, precision = 1) {
  expect(actual.distanceTo(expected)).toBeLessThan(precision)
}

const once = require('event-promise')

const { firstVersion, lastVersion } = require('./common/parallel')

squid.supportedVersions.forEach((supportedVersion, i) => {
  if (!(i >= firstVersion && i <= lastVersion)) {
    return
  }

  const mcData = require('minecraft-data')(supportedVersion)
  const version = mcData.version

  const Item = require('prismarine-item')(supportedVersion)

  describe('server with mineflayer connection ' + version.minecraftVersion, () => {
    let bot
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
      const msg1 = await once(bot, 'message')
      expect(msg1.extra[0].text).toEqual(message)
    }

    beforeEach(async () => {
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

      serv = squid.createMCServer(options)
      if (serv.supportFeature('entityCamelCase')) {
        entityName = 'EnderDragon'
      } else {
        entityName = 'ender_dragon'
      }

      await once(serv, 'listening')
      const port = serv._server.socketServer.address().port
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

      await Promise.all([once(bot, 'login'), once(bot2, 'login')])
      bot.entity.onGround = false
      bot2.entity.onGround = false
    })

    afterEach(async () => {
      await serv.quit()
    })

    function waitSpawnZone (bot, view) {
      const nbChunksExpected = (view * 2) * (view * 2)
      let c = 0
      return new Promise(resolve => {
        const listener = () => {
          c++
          if (c === nbChunksExpected) {
            bot.removeListener('chunkColumnLoad', listener)
            resolve()
          }
        }
        bot.on('chunkColumnLoad', listener)
      })
    }

    describe('actions', () => {
      it('can dig', async () => {
        await Promise.all([waitSpawnZone(bot, 2), waitSpawnZone(bot2, 2), onGround(bot), onGround(bot2)])

        const pos = bot.entity.position.offset(0, -1, 0).floored()
        const p = once(bot2, 'blockUpdate', { array: true })
        bot.dig(bot.blockAt(pos))

        const [, newBlock] = await p
        assertPosEqual(newBlock.position, pos)
        expect(newBlock.type).toEqual(0)
      })

      it('can place a block', async () => {
        await Promise.all([waitSpawnZone(bot, 2), waitSpawnZone(bot2, 2), onGround(bot), onGround(bot2)])

        const pos = bot.entity.position.offset(0, -2, 0).floored()
        const digPromise = once(bot2, 'blockUpdate', { array: true })
        bot.dig(bot.blockAt(pos))

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

        const placePromise = once(bot2, 'blockUpdate', { array: true })
        bot.placeBlock(bot.blockAt(pos.offset(0, -1, 0)), new Vec3(0, 1, 0));
        [, newBlock] = await placePromise
        assertPosEqual(newBlock.position, pos)
        expect(newBlock.type).toEqual(1)
      })

      it('can open and close a chest', async () => {
        await Promise.all([waitSpawnZone(bot, 2), onGround(bot), waitSpawnZone(bot2, 2), onGround(bot2)])

        const chestId = mcData.blocksByName.chest.id
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
      it('has an help command', async () => {
        await waitMessagePromise('bot joined the game.')
        bot.chat('/help')
        await once(bot, 'message')
      })
      it('can use /particle', async () => {
        bot.chat('/particle 5 10 100 100 100')
        await once(bot._client, 'world_particles')
      })
      it('can use /playsound', async () => {
        bot.chat('/playsound ambient.weather.rain')
        await once(bot, 'soundEffectHeard')
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
        const entity = await once(bot, 'entityDead')
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
          await onGround(bot)
          const initialPosition = bot.entity.position.clone()
          bot.chat('/tp ~1 ~-2 ~3')
          await once(bot, 'forcedMove')
          assertPosEqual(bot.entity.position, initialPosition.offset(1, -2, 3), 2)
        })
        it('can tp somebody else with relative positions', async () => {
          await Promise.all([onGround(bot), onGround(bot2)])
          const initialPosition = bot2.entity.position.clone()
          bot.chat('/tp bot2 ~1 ~-2 ~3')
          await once(bot2, 'forcedMove')
          assertPosEqual(bot2.entity.position, initialPosition.offset(1, -2, 3), 2)
        })
      })
      it('can use /deop', async () => {
        await waitMessagePromise('bot joined the game.')
        bot.chat('/deop bot')
        await waitMessage(bot, '§7§o[Server: Deopped bot]')
        bot.chat('/op bot')
        await waitMessage(bot, 'You do not have permission to use this command')
        serv.getPlayer('bot').op = true
      })
      it('can use /setblock', async () => {
        await Promise.all([waitSpawnZone(bot, 2), onGround(bot)])
        const chestId = mcData.blocksByName.chest.id
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
      it.skip('can use tabComplete', () => { // TODO to fix
        return new Promise((resolve, reject) => {
          bot.tabComplete('/give', (err, data) => {
            if (err) {
              return reject(err)
            }
            expect(data[0]).toEqual('bot')
            return resolve()
          })
        })
      })

      function waitMessagePromise (message) {
        return new Promise((resolve) => {
          const listener = (msg) => {
            if (msg.extra[0].text === message) {
              bot.removeListener('message', listener)
              resolve()
            }
          }
          bot.on('message', listener)
        })
      }

      it('can use /banlist, /ban, /pardon', async () => {
        await waitMessagePromise('bot joined the game.')
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
