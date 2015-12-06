var Vec3 = require("vec3").Vec3;

module.exports.player = (player, serv) => {

  var getPos = (num, dir='x', p=player) => {
    if (num[0] == '~') return p.position[dir] + parseInt(num.slice(1, num.length) || 0)*32;
    else return parseInt(num);
  }

  player.commands.add({
    base: 'teleport',
    aliases: ['tp'],
    info: 'to teleport a player',
    usage: '/teleport [target player] <destination player or x> [y] [z]',
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
        let x = getPos(args[0], 'x');
        let y = getPos(args[1], 'y');
        let z = getPos(args[2], 'z');
        
        player.teleport(new Vec3(x, y, z));
      } else if(args.length === 4) {
        let player_from;

        if(!(player_from = serv.getPlayer(args[0])))
          return false;

        let x = getPos(args[0], 'x', player_from);
        let y = getPos(args[1], 'y', player_from);
        let z = getPos(args[2], 'z', player_from);

        player_from.teleport(new Vec3(x, y, z));
      }
    }
  });
};
