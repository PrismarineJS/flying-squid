module.exports.player=function(player) {

  player.commands.add({
    base: 'help',
    info: 'to show all commands',
    usage: '/help [command]',
    action(params) {
      var c = params[0];
      var hash = player.commands.hash;

      if(c) {
        var f=player.commands.find(c);
        if(f==undefined || f.length==0) return 'Command '+c+' not found';
        return f[0].params.usage + ' ' + f[0].params.info;
      } else {
        var used = [];
        for(var key in hash) {
          if(used.indexOf(hash[key]) > -1) continue;
          used.push(hash[key]);

          if(hash[key].params.info && (player.op || !hash[key].params.op)) {
            var str = hash[key].params.usage + ' ' + hash[key].params.info;
            if(hash[key].params.aliases && hash[key].params.aliases.length) {
              str += ' (aliases: ' + hash[key].params.aliases.join(', ') + ')';
            }

            player.chat(str);
          }
        }
      }
    }
  });

  player.commands.add({
    base: 'ping',
    info: 'to pong!',
    usage: '/ping [number]',
    action(params) {
      var num = params[0] * 1 + 1;

      var str = 'pong';
      if(!isNaN(num)) str += ' [' + num + ']';

      player.chat(str + '!');
    }
  });

  player.commands.add({
    base: 'modpe',
    info: 'for modpe commands',
    usage: '/modpe <params>',
    parse(str) { return str ? str : false },
    action(str) {
      player.emit("modpe", str);
    }
  });

  player.commands.add({
    base: 'version',
    info: 'to get version of the server',
    usage: '/version',
    action() {
      return 'This server is running flying-squid version 0.1.0';
    }
  });

  player.commands.add({
    base: 'bug',
    info: 'to bug report',
    usage: '/bug',
    action() {
      return 'Report bugs / issues here: https://github.com/mhsjlw/flying-squid/issues';
    }
  });


  player.handleCommand = async (str) => {
    try {
      var res = await player.commands.use(str, player.op);
      if (res) player.chat('' + res);
    }
    catch(err) {
      setTimeout(() => {throw err;}, 0);
    }
  }
};

module.exports.server = function(serv) {
  serv.selector = (type, opt) => {
    if (['all', 'random', 'near', 'entity'].indexOf(type) == -1)
      return new Error('serv.selector(): type must be either [all, random, near, or entity]');

    var count = typeof opt.count != 'undefined' ?
                  count :
                  (type == 'all' || type == 'entity' ?serv.entities.length : 1);
    var pos = opt.pos;
    var sample;
    if (type == 'all') sample = serv.players;
    else if (type == 'random' || type == 'near') sample.players.filter(p => p.health != 0);
    else if (type == 'entity') sample = Object.keys(serv.entities).map(k => serv.entities[k]);

    var checkOption = (val, compare) => {
      var not = val[0] == '!';
      var v = val;
      if (not) v = v.slice(1, v.length);
      if (not && compare == v) return false;
      if (!not && compare != v) return false;
      return true;
    }

    sample.filter(s => {
      if ((opt.radius && s.position.distanceTo(pos) > opt.radius) ||
          (opt.minRadius && s.position.distanceTo(pos) < opt.minRadius) ||
          (opt.gameMode && s.gameMode != opt.gameMode) ||
          (opt.level && s.level > opt.level) ||
          (opt.minLevel && s.level < opt.minLevel) ||
          (opt.yaw && s.yaw > opt.yaw) ||
          (opt.minYaw && s.yaw < opt.minYaw) ||
          (opt.pitch && s.pitch > opt.pitch) ||
          (opt.minPitch && s.pitch < opt.minPitch))
            return false;

      if (!checkOption(opt.team, s.team)) return false;
      if (!checkOption(opt.name, s.username)) return false;
      if (!checkOption(opt.type, s.type)) return false; // "type" option of selector needs fixing
    });
  }

  serv.selectorString = (str, pos) => {
    pos = pos.clone();
    var player = serv.getPlayer(str);
    if (!player && str[0] != '@') return null;
    var match = str.match(/^@([a,r,p,e])(\[[^\]]+\])?$/);
    if (match == null) return new Error('Invalid selector format');
    var typeConversion = {
      a: 'all',
      r: 'random',
      p: 'near',
      e: 'entity'
    };
    var type = typeConversion[match[1]];
    var opt = match[2].split(',');
    var optPair = [];
    var err;
    opt.forEach(o => {
      var match = o.match(/^([^=]+)=([^=]+)$/);
      if (match == null) err = new Error('Invalid selector option format: "' + o + '"');
      else optPair.push({key: match[1], val: match[2]});
    });
    if (err) return err;

    var optConversion = {
      type: 'type',
      r: 'radius',
      rm: 'minRadius',
      m: 'gameMode',
      c: 'count',
      l: 'level',
      lm: 'minLevel',
      team: 'team',
      name: 'name',
      rx: 'yaw',
      rxm: 'minYaw',
      ry: 'pitch',
      rym: 'minPitch'
    };

    var data = {
      pos: pos
    };

    optPair.forEach(({key,val}) => {
      if (['x', 'y', 'z'].indexOf(key) != -1) pos[key] = val;
      else {
        data[optConversion[key]] = val;
      }
    });

    return serv.selector(data);
  }
}