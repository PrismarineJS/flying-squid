module.exports = inject;

function inject(serv) {
  serv.playSound = (sound, world, position, {whitelist,blacklist=[],radius=32*32,volume=1.0,pitch=1.0}={}) => {
    var players = (typeof whitelist != 'undefined' ? (typeof whitelist == 'array' ? whitelist : [whitelist]) : serv.getNearby({
      world: world,
      position: position.scaled(32).floored(),
      radius: radius // 32 blocks, fixed position
    }));
    players.filter(player => blacklist.indexOf(player) == -1)
      .forEach(player => {
        var pos = (position || player.entity.position.scaled(1/32)).scaled(8).floored();
        console.log('Data',sound, pos, volume, Math.round(pitch*63));
        player._client.write('named_sound_effect', {
          soundName: sound,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          volume: volume,
          pitch: Math.round(pitch*63)
        });
      });
  }
}