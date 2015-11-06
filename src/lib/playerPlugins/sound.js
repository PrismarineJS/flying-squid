var vec3 = require('vec3');

module.exports = inject;

function inject(serv, player) {
  player.playSound = (sound, opt={}) => {
    opt.whitelist = player;
    serv.playSound(sound, player.world, null, opt);
  }

  player._client.on('block_place', ({location}={}) => {
    if (player.entity.crouching) return;
    var pos=new vec3(location.x,location.y,location.z);
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
    var pos=new vec3(location.x,location.y,location.z);
    player.world.getBlockType(pos).then((id) => {
      if (id != 25) return;
      if (!player.world.blockEntityData[pos.toString()]) player.world.blockEntityData[pos.toString()] = {};
      var data = player.world.blockEntityData[pos.toString()];
      if (typeof data.note == 'undefined') data.note = 0;
      serv.playNoteBlock(player.world, pos, data.note);
    }).catch((err)=> setTimeout(() => {throw err;},0));
  });
}