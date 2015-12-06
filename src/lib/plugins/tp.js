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

        player_from._client.write('position', {
          x: player_to.position.x/32,
          y: player_to.position.x/32,
          z: player_to.position.x/32,
          yaw: player_to.yaw,
          pitch: player_to.pitch,
          flags: 0x00
        });
      } else if(args.length === 3) {
        player._client.write('position', {
          x: args[0],
          y: args[1],
          z: args[2],
          yaw: player.yaw,
          pitch: player.pitch,
          flags: 0x00
        });
      } else if(args.length === 4) {
        let player_from;

        if(!(player_from = serv.getPlayer(args[0])))
          return false;

        player_from._client.write('position', {
          x: args[1],
          y: args[2],
          z: args[3],
          yaw: player_from.yaw,
          pitch: player_from.pitch,
          flags: 0x00
        });
      }
    }
  });
};
