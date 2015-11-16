var vec3 = require("vec3");

module.exports.server=function(serv) {
  serv.emitParticle = (particle, world, position, {whitelist,blacklist=[],radius=32*32,longDistance,size,count}={}) => {
    var players = (typeof whitelist != 'undefined' ? (typeof whitelist == 'array' ? whitelist : [whitelist]) : serv.getNearby({
      world: world,
      position: position.scaled(32).floored(),
      radius: radius // 32 blocks, fixed position
    }));
    if (!size) size = vec3(1.0, 1.0, 1.0);
    players.filter(player => blacklist.indexOf(player) == -1)
      .forEach(player => {
        player._client.write('world_particles', {
          particleId: particle,
          longDistance: longDistance || true,
          x: position.x,
          y: position.y,
          z: position.z,
          offsetX: size.x,
          offsetY: size.y,
          offsetZ: size.z,
          particleData: 1.0,
          particles: count || 1,
          data: []
        });
      });
  }
};