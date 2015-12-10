
module.exports.entity = function(entity, serv) {
  entity.effects = {};
  for (var i = 1; i <= 23; i++) { // 23 in 1.8, 27 in 1.9
    entity.effects[i] = null; // Just so we know it's a real potion and not undefined/not existant
  }

  entity.sendEffect = (effectId, {amplifier=0,duration=30*20,particles=true,whitelist,blacklist=[]}={}) => {
    if (!whitelist) whitelist = serv.getNearby(entity);
    var sendTo = whitelist.filter(p => blacklist.indexOf(p) == -1);
    var data = {
      entityId: entity.id,
      effectId: effectId,
      amplifier: amplifier,
      duration: duration,
      hideParticles: !particles
    };
    console.log(data);
    serv._writeArray('entity_effect', data, sendTo);
  };

  entity.sendRemoveEffect = (effectId, {whitelist,blacklist=[]}={}) => {
    if (!whitelist) whitelist = serv.getNearby(entity);
    var sendTo = whitelist.filter(p => blacklist.indexOf(p) == -1);
    serv._writeArray('remove_entity_effect', {
      entityId: entity.id,
      effectId: effectId
    }, sendTo);
  };

  entity.addEffect = (effectId, opt={}) => {
    var amp = typeof opt.amplifier == 'undefined' ? 0 : opt.amplifier;
    if (!entity.effects[effectId] || opt.override || amp < entity.effects[effectId].amplifier) {
      entity.effects[effectId] = {
        amplifier: opt.amplifier || 0,
        duration: opt.duration || 30*20,
        particles: opt.particles || true,
      };
      entity.sendEffect(effectId, opt);
      return true;
    } else return false;
  }

  entity.removeEffect = (effectId, opt) => {
    entity.effects[effectId] = null;
    entity.sendRemoveEffect(effectId, opt);
  };
};

module.exports.player = function(player, serv) {
  player.commands.add({
    base: 'effect',
    info: 'Give player an effect',
    usage: '/effect <player> <effect> [seconds] [amplifier] [hideParticles]',
    parse(str) {
      return str.match(/(.+?) (\d+)(?: (\d+))?(?: (\d+))?(?: (true|false))?|.*? clear/) || false;
    },
    action(params) {
      var targets = player.selectorString(params[1]);
      if (params[2] == 'clear') {
        targets.forEach(e => Object.keys(e.effects).forEach(effectId => {
          if (e.effects[effectId] != null) e.removeEffect(effectId);
        }));
      } else {
        targets.forEach(e => {
          var effId = parseInt(params[2]);
          if (e.effects[effId]) {
            e.removeEffect(effId);
          }
          e.addEffect(effId, {
            amplifier: parseInt(params[4]) || 0,
            duration: parseInt(params[3]) * 20 || 30 * 20,
            particles: params[5] != 'true' // hidesParticles vs particles (i.e. "showParticles")
          });
        });
      }
      var chatSelect = (targets.length == 1 ? (targets[0].type == 'player' ? targets[0].username : 'entity') : 'entities');
      if (params[2] == 'clear') player.chat('Remove all effects from ' + chatSelect + '.' );
      else player.chat('Gave ' + chatSelect + ' effect ' + params[2] + '(' + (params[4] || 0) + ') for ' + 
                        (parseInt(params[3]) || 30) + ' seconds');
    }
  });
}