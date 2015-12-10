var Vec3 = require("vec3").Vec3;

module.exports.player = (player, serv) => {

  player.commands.add({
    base: 'teleport',
    aliases: ['tp'],
    info: 'to teleport a player',
    usage: '/teleport [target player] <destination player or x> [y] [z]',
    op: true,
    parse(str) {
      return str.match(/^(((\w* )?~?-?\d* ~?-?\d* ~?-?\d*)|(\w* \w*))$/) ? str.split(' ') : false;
    },
    action(args) {
      if(args.length === 2 && args[0] !== args[1]) {
        let player_from;
        let player_to;

        if(!(player_from = serv.getPlayer(args[0])) || !(player_to = serv.getPlayer(args[1])))
          return false;

        player_from.teleport(player_to.position.clone());
      } else if(args.length === 3) {
        let x = serv.posFromString(args[0], player.position.x / 32);
        let y = serv.posFromString(args[1], player.position.y / 32);
        let z = serv.posFromString(args[2], player.position.z / 32);
        
        player.teleport(new Vec3(x, y, z));
      } else if(args.length === 4) {
        let player_from;

        if(!(player_from = serv.getPlayer(args[0])))
          return false;

        let x = serv.posFromString(args[1], player_from.x / 32);
        let y = serv.posFromString(args[2], player_from.y / 32);
        let z = serv.posFromString(args[3], player_from.z / 32);

        player_from.teleport(new Vec3(x, y, z));
      }
    }
  });
};
