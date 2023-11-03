import { skipMcPrefix } from '../utils'

import { Vec3 } from 'vec3'

export const server = function (serv: Server) {
  serv.playSound = (sound, world, position, { whitelist, blacklist = [], radius = 32, volume = 1.0, pitch = 1.0, soundCategory = 0 }: any = {}) => {
    const players = (typeof whitelist !== 'undefined'
      ? (whitelist instanceof Array ? whitelist : [whitelist])
      : serv.getNearby({
        world,
        position,
        radius
      }))
    players.filter(player => blacklist.indexOf(player) === -1)
      .forEach(player => {
        const iniPos = position ? position.scaled(1 / 32) : player.position.scaled(1 / 32)
        const pos = iniPos.scaled(8).floored()
        // only packet still in fixed position in all versions
        player._client.write('named_sound_effect', {
          soundName: sound,
          soundCategory,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          volume,
          pitch: Math.round(pitch * 63)
        })
      })
  }

  serv.playNoteBlock = (pitch, world, position, { instrument = 'harp', particle = true } = {}) => {
    if (particle) {
      serv.emitParticle(23, world, position.clone().add(new Vec3(0.5, 1.5, 0.5)), {
        count: 1,
        size: new Vec3(0, 0, 0)
      })
    }
    serv.playSound('note.' + instrument, world, position, { pitch: serv.getNote(pitch) })
  }

  serv.getNote = note => 0.5 * Math.pow(Math.pow(2, 1 / 12), note)

  serv.commands.add({
    base: 'playsoundforall',
    info: 'to play sound for everyone',
    usage: '/playsoundforall <sound_name> [volume] [pitch]',
    onlyPlayer: true,
    op: true,
    parse (str) {
      const results = str.match(/([^ ]+)(?: ([^ ]+))?(?: ([^ ]+))?/)
      if (!results) return false
      return {
        sound_name: skipMcPrefix(results[1]),
        volume: results[2] ? parseFloat(results[2]) : 1.0,
        pitch: results[3] ? parseFloat(results[3]) : 1.0
      }
    },
    action (action, ctx) {
      ctx.player.chat('Playing "' + action.sound_name + '" (volume: ' + action.volume + ', pitch: ' + action.pitch + ')')
      serv.playSound(action.sound_name, ctx.player.world, ctx.player.position, { volume: action.volume, pitch: action.pitch })
    }
  })

  serv.commands.add({
    base: 'playsound',
    info: 'to play sound for yourself',
    usage: '/playsound <sound_name> [volume] [pitch]',
    onlyPlayer: true,
    op: true,
    parse (str) {
      const results = str.match(/([^ ]+)(?: ([^ ]+))?(?: ([^ ]+))?/)
      if (!results) return false
      return {
        sound_name: skipMcPrefix(results[1]),
        volume: results[2] ? parseFloat(results[2]) : 1.0,
        pitch: results[3] ? parseFloat(results[3]) : 1.0
      }
    },
    action (action, ctx) {
      ctx.player.chat('Playing "' + action.sound_name + '" (volume: ' + action.volume + ', pitch: ' + action.pitch + ')')
      ctx.player.playSound(action.sound_name, { volume: action.volume, pitch: action.pitch })
    }
  })
}

export const player = function (player: Player, serv: Server) {
  player.playSound = (sound, opt = {}) => {
    serv.playSound(sound, player.world, null, { ...opt, whitelist: player })
  }

  player.on('placeBlock_cancel', async ({ reference }, cancel) => {
    if (player.crouching) return
    const id = await player.world.getBlockType(reference)
    if (id !== 25) return
    cancel(false)
    if (!player.world.blockEntityData[reference.toString()]) player.world.blockEntityData[reference.toString()] = {}
    const data = player.world.blockEntityData[reference.toString()]
    if (typeof data.note === 'undefined') data.note = -1
    data.note++
    data.note %= 25
    serv.playNoteBlock(data.note, player.world, reference)
  })

  player.on('dig_cancel', async ({ position }, cancel) => {
    const id = await player.world.getBlockType(position)
    if (id !== 25) return
    cancel(false)
    if (!player.world.blockEntityData[position.toString()]) player.world.blockEntityData[position.toString()] = {}
    const data = player.world.blockEntityData[position.toString()]
    if (typeof data.note === 'undefined') data.note = 0
    serv.playNoteBlock(data.note, player.world, position)
  })
}

export const entity = function (entity: Entity, serv: Server) {
  entity.playSoundAtSelf = (sound, opt = {}) => {
    serv.playSound(sound, entity.world, entity.position, opt)
  }
}
declare global {
  interface Server {
    "playSound": (sound: any, world: any, position: any, { whitelist, blacklist, radius, volume, pitch, soundCategory }?: { whitelist?: any; blacklist?: any[] | undefined; radius?: number | undefined; volume?: number | undefined; pitch?: number | undefined; soundCategory?: number | undefined }) => void
    "playNoteBlock": (pitch: any, world: any, position: any, { instrument, particle }?: { instrument?: string | undefined; particle?: boolean | undefined }) => void
    "getNote": (note: any) => number
  }
  interface Player {
    "playSound": (sound: any, opt?: {}) => void
  }
  interface Entity {
    "playSoundAtSelf": (sound: any, opt?: {}) => void
  }
}
