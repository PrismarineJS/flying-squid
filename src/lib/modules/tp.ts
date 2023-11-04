import { Vec3 } from 'vec3'
import UserError from '../user_error'

export const server = (serv: Server) => {
  serv.commands.add({
    base: 'teleport',
    aliases: ['tp'],
    info: 'to teleport a player',
    usage: '/teleport [target player] <destination player or x> [y] [z]',
    op: true,
    parse (str) {
      return str.match(/^(((.* )?~?-?\d* ~?-?\d* ~?-?\d*)|(.+ .+))$/) ? str.split(' ') : false
    },
    action (args, ctx) {
      // todo use position of command block
      const selectorString = ctx.player ? ctx.player.selectorString : serv.selectorString
      if (args.length === 2) {
        const entitiesFrom = selectorString(args[0])
        const entityTo = selectorString(args[1])[0]
        if (!entityTo) throw new UserError('Invalid target')

        entitiesFrom.forEach(e => e.teleport(entityTo.position))
      } else if (args.length === 3 || args.length === 4) {
        if (args.length === 3 && !ctx.player) throw new UserError('Only player can execute command with 3 arguments')
        const entitiesFrom = args.length === 3 ? [ctx.player!] : selectorString(args[0])
        const posArgs = args.length === 3 ? args : args.slice(1)
        for (const e of entitiesFrom) {
          let x = serv.posFromString(posArgs[0], e.position.x)
          let y = serv.posFromString(posArgs[1], e.position.y)
          let z = serv.posFromString(posArgs[2], e.position.z)
          x = Math.floor(x)
          y = Math.floor(y)
          z = Math.floor(z)

          if (Math.abs(x) > 29_999_999 || Math.abs(y) > 4096 || Math.abs(z) > 29_999_999) {
            // Vanilla Minecraft limits
            throw new UserError('Invalid position')
          }

          // Vanilla behavior: teleport to center of block if decimal not specified

          if (args[0].indexOf('.') === -1) x += 0.5
          if (args[1].indexOf('.') === -1) y += 0.5
          if (args[2].indexOf('.') === -1) z += 0.5
          e.teleport(new Vec3(x, y, z))
        }
      }
    }
  })
}
declare global {
}
