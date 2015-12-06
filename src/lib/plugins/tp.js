var Vec3 = require("vec3").Vec3;

module.exports.player = (player, serv) => {
  player.commands.add({
    base: 'teleport',
    aliases: ['tp'],
    info: 'to teleport a player',
    usage: '/teleport [target player] <destination player or x> [x] [y]',
    parse(str) {
      return str.match(/^(((\w* )?\d* \d* \d*)|(\w* \w*))$/) ? str.split(' ') : false;
    },
    action(args) {
      if(args.length === 2 && args[0] !== args[1]) {
        let player_from;
        let player_to;

        if(!(player_from = serv.getPlayer(args[0])) || !(player_to = serv.getPlayer(args[1])))
          return false;

        player_from.teleport(player_to.position.clone());
      } else if(args.length === 3) {
        player.teleport(new Vec3(args[0]*32, args[1]*32, args[2]*32));
      } else if(args.length === 4) {
        let player_from;

        if(!(player_from = serv.getPlayer(args[0])))
          return false;

        player_from.teleport(new Vec3(args[1]*32, args[2]*32, args[3]*32));
      }
    }
  });
};
