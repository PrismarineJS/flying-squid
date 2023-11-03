import { Vec3 } from 'vec3'
const UserError = require('flying-squid').UserError

export const server = (serv) => {
  serv.commands.add({
    base: 'teleport',
    aliases: ['tp'],
    info: 'to teleport a player',
    usage: '/teleport [target player] <destination player or x> [y] [z]',
    onlyPlayer: true, // only for now
    op: true,
    parse (str) {
      return str.match(/^(((.* )?~?-?\d* ~?-?\d* ~?-?\d*)|(.+ .+))$/) ? str.split(' ') : false
    },
    action (args, ctx) {
      if (args.length === 2) {
        const entitiesFrom = ctx.player.selectorString(args[0])
        let entityTo = ctx.player.selectorString(args[1])
        if (entityTo.length === 0) throw new UserError('Invalid target')
        entityTo = entityTo[0]

        entitiesFrom.forEach(e => e.teleport(entityTo.position))
      } else if (args.length === 3) {
        let x = serv.posFromString(args[0], ctx.player.position.x)
        let y = serv.posFromString(args[1], ctx.player.position.y)
        let z = serv.posFromString(args[2], ctx.player.position.z)

        if (Math.abs(x) > 29999999 || Math.abs(y) > 4096 || Math.abs(z) > 29999999) {
          // Vanilla Minecraft limits
          throw new UserError('Invalid position')
        }

        // Vanilla behavior: teleport to center of block if decimal not specified

        if (args[0].indexOf('.') === -1) x += 0.5
        if (args[1].indexOf('.') === -1) y += 0.5
        if (args[2].indexOf('.') === -1) z += 0.5

        ctx.player.teleport(new Vec3(x, y, z))
      } else if (args.length === 4) {
        const entitiesFrom = ctx.player.selectorString(args[0])

        entitiesFrom.forEach(e => e.teleport(new Vec3(
          serv.posFromString(args[1], e.position.x),
          serv.posFromString(args[2], e.position.y),
          serv.posFromString(args[3], e.position.z)
        )))
      }
    }
  })
}
declare global {
}
