var vec3 = require('vec3');

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

  serv.playNoteBlock = (world, position, pitch) => {
    serv.emitParticle(23, world, position.clone().add(vec3(0.5, 1.5, 0.5)), {
      count: 1,
      size: vec3(0, 0, 0)
    });
    serv.playSound('note.harp', world, position, { pitch: serv.getNote(pitch) });
  }

  serv.getNote = note => 0.5 * Math.pow(Math.pow(2, 1/12), note);
}