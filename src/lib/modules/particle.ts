import { Vec3 } from 'vec3'

export const server = function (serv: Server) {
  serv.emitParticle = (particle, world, position, { whitelist, blacklist = [], radius = 32, longDistance = true, size = new Vec3(1, 1, 1), count = 1 }: any = {}) => {
    const players = (typeof whitelist !== 'undefined'
      ? (whitelist instanceof Array ? whitelist : [whitelist])
      : serv.getNearby({
        world,
        position,
        radius
      }))

    serv._writeArray('world_particles', {
      particleId: particle,
      longDistance,
      x: position.x,
      y: position.y,
      z: position.z,
      offsetX: size.x,
      offsetY: size.y,
      offsetZ: size.z,
      particleData: 1.0,
      particles: count,
      data: []
    }, players.filter(p => blacklist.indexOf(p) === -1))
  }

  serv.commands.add({
    base: 'particle',
    info: 'emit a particle at a position',
    usage: '/particle <id> [amount] [<sizeX> <sizeY> <sizeZ>]',
    onlyPlayer: true,
    op: true,
    parse (str) {
      const results = str.match(/(\d+)(?: (\d+))?(?: (\d+))?(?: (\d+))?(?: (\d+))?(?: (\d+))?/)
      if (!results) return false
      return {
        particle: parseInt(results[1]),
        amount: results[2] ? parseInt(results[2]) : 1,
        size: results[5] ? new Vec3(parseInt(results[3]), parseInt(results[4]), parseInt(results[5])) : new Vec3(1, 1, 1)
      }
    },
    action ({ particle, amount, size }, ctx) {
      if (amount >= 100000) {
        ctx.player.chat('You cannot emit more than 100,000 particles!')
        return
      }
      ctx.player.chat('Emitting "' + particle + '" (count: ' + amount + ', size: ' + size.toString() + ')')
      serv.emitParticle(particle, ctx.player.world, ctx.player.position, { count: amount, size })
    }
  })
}
declare global {
  interface Server {
    "emitParticle": (particle: any, world: any, position: any, { whitelist, blacklist, radius, longDistance, size, count }?: { whitelist?: any; blacklist?: any[] | undefined; radius?: number | undefined; longDistance?: boolean | undefined; size?: any; count?: number | undefined }) => void
  }
}
