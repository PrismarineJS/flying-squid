var Vec3 = require('vec3');
module.exports = inject;

var Command = require('../command');

function inject(serv, player) {
  var base = new Command({});

  base.add({
    base: 'help',
    info: 'to show all commands',
    usage: '/help [command]',
    action(params) {
      var c = params[0];
      var hash = base.hash;

      if(c) {
        var res = base.find(params[0])[0];

        var help = res.params.help && res.params.help(params);
        return help ? '' + help : 'Information not found';
      } else {
        var used = [];
        for(var key in hash) {
          if(used.indexOf(hash[key]) > -1) continue;
          used.push(hash[key]);

          if(hash[key].params.info) {
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

  base.add({
    base: 'gamemode',
    aliases: ['gm'],
    info: 'to change game mode',
    usage: '/gamemode <0-3>',
    parse(str) {
      var results;
      if(!(results = str.match(/^([0-3])$/)))
        return false;
      return parseInt(str);
    },
    action(mode) {
      player.setGameMode(mode);
    }
  });

  base.add({
    base: 'setblock',
    info: 'to put a block',
    usage: '/setblock <x> <y> <z> <id>',
    parse(str) {
      var results = str.match(/^(~|~?-?[0-9]*) (~|~?-?[0-9]*) (~|~?-?[0-9]*) ([0-9]{1,3})/);

      if(!results) return false;
      else return results;
    },
    action(params) {
      var res = params.map((num, i) => { // parseInt paramaters
        if (num.indexOf('~') == 0) {
          return (player.entity.position[['', 'x', 'y', 'z'][i]] >> 5) + parseInt(num.slice(1) || 0);
        } else {
          return parseInt(num); // return parseInt>>5 if position, not id
        }
      });

      player.setBlock(new Vec3(res[1], res[2], res[3]), res[4]);
    }
  });

  base.add({
    base: 'kick',
    info: 'to kick a player',
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
    action(params) {
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
    info: 'to ban a player',
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
    action(params) {
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
    info: 'to pardon a player',
    usage: '/pardon <player>',
    parse(str) {
      var res = false;

      if(str.match(/([a-zA-Z0-9_]+)/)) {
        res = str;
      }

      return res;
    },
    action(nick) {
      serv.pardonUsername(nick)
      .then(()=> player.chat(nick + " is unbanned"))
      .catch(err => player.chat(nick + " is not banned"));
    }
  });

  base.add({
    base: 'time',
    info: 'to change a time',
    usage: '/time <add|query|set> <value>',
    parse(str) {
      var res = false;

      var data = str.match(/^(add|query|set)(?: ([0-9]+|day|night))?/);
      if(!data) return false;

      if(data.length ==3) {
        if (data[2] == 'day') data[2] = 1000;
        if (data[2] == 'night') data[2] = 13000;
      }

      return [data[1], data[2]];
    },
    action(params) {
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
    info: 'to change a time to day',
    usage: '/day',
    action(params) {
      player.handleCommand('time set day');
    }
  });

  base.add({
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

  base.add({
    base: 'night',
    info: 'to change a time to night',
    usage: '/night',
    action(params) {
      player.handleCommand('time set night');
    }
  });

  base.add({
    base: 'modpe',
    info: 'for modpe commands',
    usage: '/modpe <params>',
    parse(str) { return str ? str : false },
    action(str) {
      player.emit("modpe", str);
    }
  });

  base.add({
    base: 'version',
    info: 'to get version of the server',
    usage: '/version',
    action() {
      return 'This server is running flying-squid version 0.1.0';
    }
  });

  base.add({
    base: 'bug',
    info: 'to bug report',
    usage: '/bug',
    action() {
      return 'Report bugs / issues here: https://github.com/mhsjlw/flying-squid/issues';
    }
  });

  base.add({
    base: 'changeworld',
    info: 'to change world',
    usage: '/changeworld overworld|nether',
    action(world) {
      if(world=="nether") player.changeWorld(serv.netherworld, {dimension: -1});
      if(world=="overworld") player.changeWorld(serv.overworld, {dimension: 0});
    }
  });

  serv.commands = base;

  player.handleCommand = (str) => {
    var res = base.use(str);
    if(res) player.chat('' + res);
  };
}
