var Vec3 = require('vec3').Vec3;

module.exports.server=function(serv) {
  serv.playSound = (sound, world, position, {whitelist,blacklist=[],radius=32*32,volume=1.0,pitch=1.0}={}) => {
    var players = (typeof whitelist != 'undefined' ? (typeof whitelist == 'array' ? whitelist : [whitelist]) : serv.getNearby({
      world: world,
      position: position.scaled(32).floored(),
      radius: radius // 32 blocks, fixed position
    }));
    players.filter(player => blacklist.indexOf(player) == -1)
      .forEach(player => {
        var pos = (position || player.position.scaled(1/32)).scaled(8).floored();
        player._client.write('named_sound_effect', {
          soundName: sound,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          volume: volume,
          pitch: Math.round(pitch*63)
        });
      });
  };

  serv.playNoteBlock = (world, position, pitch) => {
    serv.emitParticle(23, world, position.clone().add(new Vec3(0.5, 1.5, 0.5)), {
      count: 1,
      size: new Vec3(0, 0, 0)
    });
    serv.playSound('note.harp', world, position, { pitch: serv.getNote(pitch) });
  };

  serv.getNote = note => 0.5 * Math.pow(Math.pow(2, 1/12), note);
};

module.exports.player=function(player,serv) {
  player.playSound = (sound, opt={}) => {
    opt.whitelist = player;
    serv.playSound(sound, player.world, null, opt);
  };

  player._client.on('block_place', ({location}={}) => {
    if (player.crouching) return;
    var pos=new Vec3(location.x,location.y,location.z);
    player.world.getBlockType(pos).then((id) => {
      if (id != 25) return;
      if (!player.world.blockEntityData[pos.toString()]) player.world.blockEntityData[pos.toString()] = {};
      var data = player.world.blockEntityData[pos.toString()];
      if (typeof data.note == 'undefined') data.note = -1;
      data.note++;
      data.note %= 25;
      serv.playNoteBlock(player.world, pos, data.note);
    }).catch((err)=> setTimeout(() => {throw err;},0));
  });

  player._client.on('block_dig', ({location,status} = {}) => {
    if (status != 0 || player.gameMode == 1) return;
    var pos=new Vec3(location.x,location.y,location.z);
    player.world.getBlockType(pos).then((id) => {
      if (id != 25) return;
      if (!player.world.blockEntityData[pos.toString()]) player.world.blockEntityData[pos.toString()] = {};
      var data = player.world.blockEntityData[pos.toString()];
      if (typeof data.note == 'undefined') data.note = 0;
      serv.playNoteBlock(player.world, pos, data.note);
    }).catch((err)=> setTimeout(() => {throw err;},0));
  });


  player.commands.add({
    base: 'playsound',
    info: 'to play sound for yourself',
    usage: '/playsound <sound_name> [volume] [pitch]',
    parse(str) {
      var results=str.match(/([^ ]+)(?: ([^ ]+))?(?: ([^ ]+))?/);
      if(!results) return false;
      return {
        sound_name:results[1],
        volume:results[2] ? parseFloat(results[2]) : 1.0,
        pitch:results[3] ? parseFloat(results[3]) : 1.0
      };
    },
    action({sound_name,volume,pitch}) {
      player.chat('Playing "'+sound_name+'" (volume: ' + volume + ', pitch: ' + pitch + ')');
      player.playSound(sound_name, {volume: volume,pitch: pitch});
    }
  });

  player.commands.add({
    base: 'playsoundforall',
    info: 'to play sound for everyone',
    usage: '/playsoundforall <sound_name> [volume] [pitch]',
    parse(str) {
      var results=str.match(/([^ ]+)(?: ([^ ]+))?(?: ([^ ]+))?/);
      if(!results) return false;
      return {
        sound_name:results[1],
        volume:results[2] ? parseFloat(results[2]) : 1.0,
        pitch:results[3] ? parseFloat(results[3]) : 1.0
      };
    },
    action({sound_name,volume,pitch}) {
      player.chat('Playing "'+sound_name+'" (volume: ' + volume + ', pitch: ' + pitch + ')');
      serv.playSound(sound_name, player.world, player.position.scaled(1/32), {volume: volume,pitch: pitch});
    }
  });
};

module.exports.entity=function(entity,serv) {
  entity.playSoundAtSelf = (sound, opt={}) => {
    serv.playSound(sound, entity.world, entity.position.scaled(1/32), opt);
  }
};