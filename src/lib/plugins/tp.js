const { Vec3 } = require('vec3');
const UserError = require('flying-squid').UserError;

module.exports.player = (player, serv) => {
  player.commands.add({
    base: 'teleport',
    aliases: ['tp'],
    info: 'to teleport a player',
    usage: '/teleport [target player] <destination player or x> [y] [z]',
    op: true,
    parse(str) {
      return str.match(/^(((.* )?~?-?\d* ~?-?\d* ~?-?\d*)|(.+ .+))$/) ? str.split(' ') : false;
    },
    action(args) {
      if (args.length === 2) {
        const entities_from = player.selectorString(args[0]);
        let entity_to = player.selectorString(args[1]);
        if (entity_to.length == 0) throw new UserError('Invalid target');
        entity_to = entity_to[0];

        entities_from.forEach(e => e.teleport(entity_to.position.scaled(1 / 32)));
      } else if (args.length === 3) {
        const x = serv.posFromString(args[0], player.position.x / 32);
        const y = serv.posFromString(args[1], player.position.y / 32);
        const z = serv.posFromString(args[2], player.position.z / 32);

        player.teleport(new Vec3(x, y, z));
      } else if (args.length === 4) {
        const entities_from = player.selectorString(args[0]);

        entities_from.forEach(e => e.teleport(new Vec3(
          serv.posFromString(args[1], e.position.x / 32),
          serv.posFromString(args[2], e.position.y / 32),
          serv.posFromString(args[3], e.position.z / 32),
        )));
      }
    },
  });
};
