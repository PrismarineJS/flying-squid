var Vec3 = require("vec3").Vec3;

module.exports.server=function(serv) {
  serv.emitParticle = (particle, world, position, {whitelist,blacklist=[],radius=32*32,longDistance=true,size,count=1}={}) => {
    var players = (typeof whitelist != 'undefined' ? (typeof whitelist == 'array' ? whitelist : [whitelist]) : serv.getNearby({
      world: world,
      position: position.scaled(32).floored(),
      radius: radius // 32 blocks, fixed position
    }));
    if (!size) size = new Vec3(1.0, 1.0, 1.0);

    serv._writeArray('world_particles', {
      particleId: particle,
      longDistance: longDistance,
      x: position.x,
      y: position.y,
      z: position.z,
      offsetX: size.x,
      offsetY: size.y,
      offsetZ: size.z,
      particleData: 1.0,
      particles: count,
      data: []
    }, players.filter(p => blacklist.indexOf(p) == -1));
  }
};

module.exports.player=function(player,serv){
  player.commands.add({
    base: 'particle',
    info: 'emit a particle at a position',
    usage: '/particle <id> [amount] [<sizeX> <sizeY> <sizeZ>]',
    parse(str) {
      var results=str.match(/(\d+)(?: (\d+))?(?: (\d+))?(?: (\d+))?(?: (\d+))?(?: (\d+))?/);
      if(!results) return false;
      return {
        particle:parseInt(results[1]),
        amount:results[2] ? parseInt(results[2]) : 1,
        size:results[5] ? new Vec3(parseInt(results[3]), parseInt(results[4]), parseInt(results[5])) : new Vec3(1, 1, 1)
      };
    },
    action({particle,amount,size}) {
      if (amount >= 100000) {
        player.chat('You cannot emit more than 100,000 particles!');
        return;
      }
      player.chat('Emitting "' + particle + '" (count: ' + amount + ', size: ' + size.toString() + ')');
      serv.emitParticle(particle, player.world, player.position.scaled(1/32), {count: amount,size: size});
    }
  });
};