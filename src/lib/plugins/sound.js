const { Vec3 } = require('vec3');

module.exports.server = function (serv) {
  serv.playSound = (sound, world, position, {
    whitelist, blacklist = [], radius = 32 * 32, volume = 1.0, pitch = 1.0,
  } = {}) => {
    const players = (typeof whitelist !== 'undefined' ? (typeof whitelist instanceof Array ? whitelist : [whitelist]) : serv.getNearby({
      world,
      position: position.scaled(32).floored(),
      radius, // 32 blocks, fixed position
    }));
    players.filter(player => blacklist.indexOf(player) == -1)
      .forEach((player) => {
        const pos = (position || player.position.scaled(1 / 32)).scaled(8).floored();
        player._client.write('named_sound_effect', {
          soundName: sound,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          volume,
          pitch: Math.round(pitch * 63),
        });
      });
  };

  serv.playNoteBlock = (pitch, world, position, { instrument = 'harp', particle = true } = {}) => {
    if (particle) {
      serv.emitParticle(23, world, position.clone().add(new Vec3(0.5, 1.5, 0.5)), {
        count: 1,
        size: new Vec3(0, 0, 0),
      });
    }
    serv.playSound(`note.${instrument}`, world, position, { pitch: serv.getNote(pitch) });
  };

  serv.getNote = note => 0.5 * (2 ** ((1 / 12) ** note));
};

module.exports.player = function (player, serv) {
  player.playSound = (sound, opt = {}) => {
    opt.whitelist = player;
    serv.playSound(sound, player.world, null, opt);
  };

  player.on('placeBlock_cancel', async ({ reference }, cancel) => {
    if (player.crouching) return;
    const id = await player.world.getBlockType(reference);
    if (id != 25) return;
    cancel(false);
    if (!player.world.blockEntityData[reference.toString()]) player.world.blockEntityData[reference.toString()] = {};
    const data = player.world.blockEntityData[reference.toString()];
    if (typeof data.note === 'undefined') data.note = -1;
    data.note++;
    data.note %= 25;
    serv.playNoteBlock(data.note, player.world, reference);
  });

  player.on('dig_cancel', async ({ position }, cancel) => {
    const id = await player.world.getBlockType(position);
    if (id != 25) return;
    cancel(false);
    if (!player.world.blockEntityData[position.toString()]) player.world.blockEntityData[position.toString()] = {};
    const data = player.world.blockEntityData[position.toString()];
    if (typeof data.note === 'undefined') data.note = 0;
    serv.playNoteBlock(data.note, player.world, position);
  });


  player.commands.add({
    base: 'playsound',
    info: 'to play sound for yourself',
    usage: '/playsound <sound_name> [volume] [pitch]',
    op: true,
    parse(str) {
      const results = str.match(/([^ ]+)(?: ([^ ]+))?(?: ([^ ]+))?/);
      if (!results) return false;
      return {
        sound_name: results[1],
        volume: results[2] ? parseFloat(results[2]) : 1.0,
        pitch: results[3] ? parseFloat(results[3]) : 1.0,
      };
    },
    action({ sound_name, volume, pitch }) {
      player.chat(`Playing "${sound_name}" (volume: ${volume}, pitch: ${pitch})`);
      player.playSound(sound_name, { volume, pitch });
    },
  });

  player.commands.add({
    base: 'playsoundforall',
    info: 'to play sound for everyone',
    usage: '/playsoundforall <sound_name> [volume] [pitch]',
    op: true,
    parse(str) {
      const results = str.match(/([^ ]+)(?: ([^ ]+))?(?: ([^ ]+))?/);
      if (!results) return false;
      return {
        sound_name: results[1],
        volume: results[2] ? parseFloat(results[2]) : 1.0,
        pitch: results[3] ? parseFloat(results[3]) : 1.0,
      };
    },
    action({ sound_name, volume, pitch }) {
      player.chat(`Playing "${sound_name}" (volume: ${volume}, pitch: ${pitch})`);
      serv.playSound(sound_name, player.world, player.position.scaled(1 / 32), { volume, pitch });
    },
  });
};

module.exports.entity = function (entity, serv) {
  entity.playSoundAtSelf = (sound, opt = {}) => {
    serv.playSound(sound, entity.world, entity.position.scaled(1 / 32), opt);
  };
};
