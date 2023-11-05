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
    /** Emits particle (see [id list](http://wiki.vg/Protocol#Particle)) at `position` in `world`.,    * ,    * Opt:,    * - whitelist: Array of players that can see the particle (can be a player object),    * - blacklist: Array of players who cannot see the particle,    * - radius: Radius that the particle can be seen from,    * - longDistance: I don't know what this is. I think this is pointless with our implenetation of radius, not sure though...,    * - size: vec3 of the size. (0,0,0) will be at an exact position, (10,10,10) will be very spread out (particles less dense),    * - count: Number of particles. 100,000,000+ will crash the client. Try not to go over 100,000 (sincerely, minecraft clients)    */
    "emitParticle": (particle: any, world: any, position: any, { whitelist, blacklist, radius, longDistance, size, count }?: { whitelist?: any; blacklist?: any[] | undefined; radius?: number | undefined; longDistance?: boolean | undefined; size?: any; count?: number | undefined }) => void
  }
}
