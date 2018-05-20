const Vec3 = require('vec3').Vec3
const UserError = require('flying-squid').UserError

module.exports.player = (player, serv) => {
  player.commands.add({
    base: 'teleport',
    aliases: ['tp'],
    info: 'to teleport a player',
    usage: '/teleport [target player] <destination player or x> [y] [z]',
    op: true,
    parse (str) {
      return str.match(/^(((.* )?~?-?\d* ~?-?\d* ~?-?\d*)|(.+ .+))$/) ? str.split(' ') : false
    },
    action (args) {
      if (args.length === 2) {
        let entitiesFrom = player.selectorString(args[0])
        let entityTo = player.selectorString(args[1])
        if (entityTo.length === 0) throw new UserError('Invalid target')
        entityTo = entityTo[0]

        entitiesFrom.forEach(e => e.teleport(entityTo.position))
      } else if (args.length === 3) {
        let x = serv.posFromString(args[0], player.position.x)
        let y = serv.posFromString(args[1], player.position.y)
        let z = serv.posFromString(args[2], player.position.z)

        player.teleport(new Vec3(x, y, z))
      } else if (args.length === 4) {
        let entitiesFrom = player.selectorString(args[0])

        entitiesFrom.forEach(e => e.teleport(new Vec3(
          serv.posFromString(args[1], e.position.x),
          serv.posFromString(args[2], e.position.y),
          serv.posFromString(args[3], e.position.z)
        )))
      }
    }
  })
}
