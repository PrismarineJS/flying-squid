var Vec3 = require('vec3');
module.exports = inject;

var hash = {};

class Command {
  constructor(params, parent) {
    this.params = params;
    this.parent = parent;
    this.child = [];

    this.updateHistory();
  }

  static find(command) {
    var res;
    for(var key in hash) {
      var space = hash[key].space(true);
      if(space) space += '?';

      var ended = space + '(.*)';

      var finded = command.match(new RegExp('^' + key + ended));
      if(finded) {
        res = [hash[key], finded];
      }
    }

    return res;
  }

  static use(command, serv, player, options) {
    var res = this.find(command);

    if(res) {
      var parse = res[0].params.parse;
      if(parse) {
        if(typeof parse == 'function') {
          res[1] = parse(res[1][1]);
          if(res[1] === false) {
            player.chat(res[0].params.usage ? 'Usage: ' + res[0].params.usage : 'Bad syntax');
            return;
          }
        } else {
          res[1] = res[1][1].match(parse);
        }
      } else {
        res[1].shift();
      }

      res = res[0].params.action(res[1], serv, player, options);
      if(res) player.chat('' + res);
    } else {
      player.chat('Command not found');
    }
  }

  updateHistory() {
    var all = '(.+?)';

    var list = [this.params.base];
    if(this.params.aliases && this.params.aliases.length) {
      this.params.aliases.forEach(al => list.unshift(al));
    }

    list.forEach((command) => {
      var parentBase = this.parent ? (this.parent.path || '') : '';
      this.path = parentBase + this.space() + (command || all);
      if(this.path == all && !this.parent) this.path = '';

      if(this.path) hash[this.path] = this;
    });
  }

  add(params) {
    var command = new Command(params, this);
    this.child.push(command);

    return command;
  }

  space(end) {
    var first = !(this.parent && this.parent.parent);
    return this.params.merged || (!end && first) ? '' : ' ';
  }
}

var base = new Command({ basic: true });

base.add({
  base: 'help',
  info: 'for show all commands',
  usage: '/help [command]',
  action(params, serv, player, options) {
    var c = params[0];

    if(c) {
      var res = Command.find(params[0])[0];

      var help = res.params.help && res.params.help(params);
      return help ? '' + help : 'Information not found';
    } else {
      var used = [];
      for(var key in hash) {
        if(used.indexOf(hash[key]) > -1) continue;
        used.push(hash[key]);

        if(hash[key].params.info) {
          var str = '/' + hash[key].path + ' ' + hash[key].params.info;
          if(hash[key].params.aliases && hash[key].params.aliases.length) {
            str += ' (aliases: ' + hash[key].params.aliases.join(', ') + ')';
          }

          player.chat(str);
        }
      }
    }
  }
});

base.add({
  base: 'gamemode',
  aliases: ['gm'],
  info: 'for change game mode',
  usage: '/gamemode <0-3>',
  parse() {
    var mode = parseInt(params[0]);
    if(mode < 0 || mode > 3) return false;
    else return mode;
  },
  action(mode, serv, player) {
    player.setGameMode(mode);
  }
});

base.add({
  base: 'setblock',
  info: 'for put block',
  usage: '/setblock <x> <y> <z> <id>',
  parse(str) {
    var results = str.match(/^(~|~?-?[0-9]*) (~|~?-?[0-9]*) (~|~?-?[0-9]*) ([0-9]{1,3})/);

    if(!results) return false;
    else return results;
  },
  action(params, serv, player) {
    var res = params.map(function (num, i) { // parseInt paramaters
      if (num.indexOf('~') == 0) {
        return (player.entity.position[['', 'x', 'y', 'z'][i]] >> 5) + parseInt(num.slice(1) || 0);
      } else {
        return parseInt(num); // return parseInt>>5 if position, not id
      }
    });

    serv.setBlock(new Vec3(res[1], res[2], res[3]), res[4]);
  }
});

base.add({
  base: 'kick',
  info: 'for kick a player',
  usage: '/kick <player> [reason]',
  parse(str) {
    var res = false;

    if(str.match(/([a-zA-Z0-9_]+)(?: (.*))/)) {
      str = str.split(' ');
      var nick = str.shift();
      var reason = str.join(' ');

      res = [nick, reason];
    }

    return res;
  },
  action(params, serv, player) {
    var username = params[0];
    var reason = params[1];

    var kickPlayer = serv.getPlayer(username);
    if (!kickPlayer) {
      player.chat(username + " is not on this server!");
    } else {
      kickPlayer.kick(reason);
      kickPlayer.emit("kicked", player, reason);
    }
  }
});

base.add({
  base: 'ban',
  info: 'for ban a player',
  usage: '/ban <player> [reason]',
  parse(str) {
    var res = false;

    if(str.match(/([a-zA-Z0-9_]+)(?: (.*))/)) {
      str = str.split(' ');
      var nick = str.shift();
      var reason = str.join(' ');

      res = [nick, reason];
    }

    return res;
  },
  action(params, serv, player) {
    var username = params[0];
    var reason = params[1];

    var banPlayer = serv.getPlayer(username);

    if (!banPlayer) {
      serv.banUsername(username, reason)
      .then(() => {
        serv.emit('banned', player, username, reason);
        player.chat(username + ' was banned');
      })
      .catch(err => player.chat(username + " is not a valid player!"));
    } else {
      banPlayer.ban(reason);
      serv.emit("banned", player, username, reason);
    }
  }
});

base.add({
  base: 'pardon',
  info: 'for pardon a player',
  usage: '/pardon <player>',
  parse(str) {
    var res = false;

    if(str.match(/([a-zA-Z0-9_]+)/)) {
      res = str;
    }

    return res;
  },
  action(nick, serv, player) {
    serv.pardonUsername(nick)
    .then(()=> player.chat(nick + " is unbanned"))
    .catch(err => player.chat(nick + " is not banned"));
  }
});

base.add({
  base: 'time',
  info: 'for change a time',
  usage: '/time <add|query|set> <value>',
  parse(str) {
    var res = false;

    var data = str.match(/^(add|query|set)(?: ([0-9]+|day|night))?/);

    if(data[2] == 'day') data[2] = 1000;
    if(data[2] == 'night') data[2] = 13000;

    return [data[1], data[2]];
  },
  action(params, serv, player) {
    var action = params[0];
    var value = params[1] !== undefined ? parseInt(params[1]) : null;

    if(action == "query") {
      player.chat("It is "+serv.time);
    } else {
      var newTime;

      if(action == "set") {
        newTime = value;
      } else if(action == "add") {
        newTime = value + serv.time;
      }

      player.chat("Time was changed from " + serv.time + " to " + newTime);
      serv.setTime(newTime);
    }
  }
});

base.add({
  base: 'day',
  info: 'for change a time to day',
  usage: '/day',
  action(params, serv, player) {
    player.handleCommand('time set day');
  }
});

base.add({
  base: 'ping',
  info: 'for pong!',
  usage: '/ping [number]',
  action(params, serv, player) {
    var num = params[0] * 1 + 1;

    var str = 'pong';
    if(!isNaN(num)) str += ' [' + num + ']';

    player.chat(str + '!');
  }
});

base.add({
  base: 'night',
  info: 'for change a time to night',
  usage: '/night',
  action(params, serv, player) {
    player.handleCommand('time set night');
  }
});

base.add({
  base: 'modpe',
  info: 'for modpe commands',
  usage: '/modpe <params>',
  parse(str) { return str ? str : false },
  action(str, serv, player) {
    player.emit("modpe", str);
  }
});

base.add({
  base: 'version',
  info: 'for get version of the server',
  action() {
    return 'This server is running flying-squid version 0.1.0';
  }
});

base.add({
  base: 'bug',
  info: 'for bug report',
  action() {
    return 'Report bugs / issues here: https://github.com/mhsjlw/flying-squid/issues';
  }
});

function inject(serv, player, options) {
  player.handleCommand = function(str) {
    return Command.use(str, serv, player, options);
  };
}
