var Vec3 = require("vec3").Vec3;
var UserError = require('flying-squid').UserError;

module.exports.player=function(player, serv) {

  player.commands.add({
    base: 'help',
    info: 'to show all commands',
    usage: '/help [command]',
    parse(str) {
      var params = str.split(' ');
      var page = parseInt(params[params.length-1]);
      var search = '';
      if (page) {
        params.pop();
      }
      search = params.join(' ');
      return { search: search, page: (page && page - 1) || 0 };
    },
    action({search, page}) {
      if (page < 0) return 'Page # must be >= 1';
      var hash = player.commands.uniqueHash;

      var PAGE_LENGTH = 7;

      var found = Object.keys(hash).filter(h => (h + ' ').indexOf((search && search + ' ') || '') == 0);

      if (found.length == 0) { // None found
        return 'Could not find any matches';
      } else if (found.length == 1) { // Single command found, giev info on command
        var cmd = hash[found[0]];
        var usage = (cmd.params && cmd.params.usage) || cmd.base;
        var info = (cmd.params && cmd.params.info) || 'No info';
        player.chat(usage + ': ' + info);
      } else { // Multiple commands found, give list with pages
        var totalPages = Math.ceil((found.length-1) / PAGE_LENGTH);
        if (page >= totalPages) return 'There are only' + totalPages + ' help pages';
        found = found.sort();
        if (found.indexOf('search') != -1) {
          var baseCmd = hash[search];
          player.chat(baseCmd.base + ' -' + ((baseCmd.params && baseCmd.params.info && ' ' + baseCmd.params.info) || '=-=-=-=-=-=-=-=-'));
        } else {
          player.chat('Help -=-=-=-=-=-=-=-=-');
        }
        for (var i = PAGE_LENGTH*page; i < Math.min(PAGE_LENGTH*(page + 1), found.length); i++) {
          if (found[i] === search) continue;
          var cmd = hash[found[i]];
          var usage = (cmd.params && cmd.params.usage) || cmd.base;
          var info = (cmd.params && cmd.params.info) || 'No info';
          player.chat(usage + ': ' + info);
        }
        player.chat('--=[Page ' + (page + 1) + ' of ' + totalPages + ']=--')
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

  player.commands.add({
    base: 'selector',
    info: 'Get array from selector',
    usage: '/selector <selector>',
    op: true,
    parse(str) {
      return str || false;
    },
    action(sel) {
      var arr = serv.selectorString(sel, player.position.scaled(1/32), player.world);
      if (arr == null) return 'Could not find player';
      else player.chat(JSON.stringify(arr.map(a => a.id)));
    }
  });


  player.handleCommand = async (str) => {
    try {
      var res = await player.commands.use(str, player.op);
      if (res) player.chat('' + res);
    }
    catch(err) {
      if (err instanceof UserError) player.chat('Error: ' + err.toString());
      else setTimeout(() => {throw err;}, 0);
    }
  }
};

module.exports.entity = function(entity, serv) {
  entity.selectorString = (str) => serv.selectorString(str, entity.position.scaled(1/32), entity.world);
}

module.exports.server = function(serv) {

  function shuffleArray(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  var notudf = i => typeof i != 'undefined';

  serv.selector = (type, opt) => {
    if (['all', 'random', 'near', 'entity'].indexOf(type) == -1)
      throw new UserError('serv.selector(): type must be either [all, random, near, or entity]');

    var count = typeof opt.count != 'undefined' ?
                  count :
                  (type == 'all' || type == 'entity' ?serv.entities.length : 1);
    var pos = opt.pos;
    var sample;
    if (type == 'all') sample = serv.players;
    else if (type == 'random' || type == 'near') sample = serv.players.filter(p => p.health != 0);
    else if (type == 'entity') sample = Object.keys(serv.entities).map(k => serv.entities[k]);

    var checkOption = (val, compare) => {
      if (!val) return true;
      var not = val[0] == '!';
      var v = val;
      if (not) v = v.slice(1, v.length);
      if (not && compare == v) return false;
      if (!not && compare != v) return false;
      return true;
    }

    var scores = {
      max: [],
      min: []
    };

    Object.keys(opt).forEach(o => {
      if (o.indexOf('score_') != 0) return;
      var score = o.replace('score_', '');
      if (score.indexOf('_min') == score.length - 1) {
        scores.min.push({
          score: score.replace('_min' ,''),
          val: opt[o]
        });
      } else {
        scores.max.push({
          score: score,
          val: opt[o]
        });
      }
    });

    sample = sample.filter(s => {
      if ((notudf(opt.radius) && s.position.scaled(1/32).distanceTo(pos) > opt.radius) ||
          (notudf(opt.minRadius) && s.position.scaled(1/32).distanceTo(pos) < opt.minRadius) ||
          (notudf(opt.gameMode) && s.gameMode != opt.gameMode) ||
          (notudf(opt.level) && s.level > opt.level) ||
          (notudf(opt.minLevel) && s.level < opt.minLevel) ||
          (notudf(opt.yaw) && s.yaw > opt.yaw) ||
          (notudf(opt.minYaw) && s.yaw < opt.minYaw) ||
          (notudf(opt.pitch) && s.pitch > opt.pitch) ||
          (notudf(opt.minPitch) && s.pitch < opt.minPitch))
            return false;

      if (!checkOption(opt.team, s.team)) return false;
      if (!checkOption(opt.name, s.username)) return false;
      if (!checkOption(opt.type, s.name)) return false;

      var fail = false;
      scores.max.forEach(m => {
        if (fail) return;
        if (!notudf(s.scores[m.score])) fail = true;
        else if (s.scores[m] > m.val) fail = true;
      });
      if (fail) return false;
      scores.min.forEach(m => {
        if (fail) return;
        if (!notudf(s.scores[m.score])) faii = true;
        else if (s.scores[m] < m.val) fail = true;
      });
      if (fail) return false;

      return true;
    });

    if (type == 'near') sample.sort((a,b) => a.position.distanceTo(opt.pos) > b.position.distanceTo(opt.pos));
    else if (type == 'random') sample = shuffleArray(sample);
    else sample = sample.reverse(); // Front = newest

    if (count > 0) return sample.slice(0, count);
    else return sample.slice(count); // Negative, returns from end
  }

  serv.selectorString = (str, pos, world, allowUser=true) => {
    pos = pos.clone();
    var player = serv.getPlayer(str);
    if (!player && str[0] != '@') return null;
    else if (player) return allowUser ? [player] : null;
    var match = str.match(/^@([a,r,p,e])(?:\[([^\]]+)\])?$/);
    if (match == null) throw new UserError('Invalid selector format');
    var typeConversion = {
      a: 'all',
      r: 'random',
      p: 'near',
      e: 'entity'
    };
    var type = typeConversion[match[1]];
    var opt = match[2] ? match[2].split(',') : [];
    var optPair = [];
    var err;
    opt.forEach(o => {
      var match = o.match(/^([^=]+)=([^=]+)$/);
      if (match == null) err = new UserError('Invalid selector option format: "' + o + '"');
      else optPair.push({key: match[1], val: match[2]});
    });
    if (err) throw err;

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
    var convertInt = ['r', 'rm', 'm', 'c', 'l', 'lm', 'rx', 'rxm', 'ry', 'rym'];

    var data = {
      pos: pos,
      world: world,
      scores: [],
      minScores: []
    };

    optPair.forEach(({key,val}) => {
      if (['x', 'y', 'z'].indexOf(key) != -1) pos[key] = val;
      else if (!optConversion[key]) {
        data[key] = val;
      }
      else {
        if (convertInt.indexOf(key) != -1) val = parseInt(val);
        data[optConversion[key]] = val;
      }
    });

    return serv.selector(type, data);
  }

  serv.posFromString = (str, pos) => {
    if (parseInt(str)) return parseInt(str);
    if (str.match(/~-?\d+/)) return parseInt(str.slice(1)) + pos;
    else if (str == '~') return pos;
    else throw new UserError('Invalid position');
  };
}