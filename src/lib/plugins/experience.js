module.exports.player = function(player, serv) {
  player.xp = 0;
  player.displayXp = 0;
  player.xpLevel = 0;

  player.sendXp = () => {
    player._client.write('experience', {
      experienceBar: player.displayXp,
      level: player.level,
      totalExperience: player.xp
    });
  }

  player.setXpLevel = (level) => {
    player.xpLevel = level;
    player.sendXp();
  }

  player.setDisplayXp = (num) => {
    player.displayXp = Math.max(0, Math.min(1, player.displayXp));
    player.sendXp();
  }

  player.setXp = (xp, { setLevel=true, setDisplay=true, send=true }={}) => {
    player.xp = xp;
    if (setLevel) player.level = serv.getXpLevel(xp);
    if (setDisplay) player.displayXp = serv.distanceToXpLevel(xp);
    if (send) player.sendXp();
  }

  player.commands.add({
    base: 'xp',
    info: 'Give yourself experience',
    usage: '/xp <amount> [player] OR /xp <amount>L [player]',
    op: true,
    parse(str) {
      return str.match(/(-?\d+)(L)? ?([a-zA-Z0-9_]+)?/) || false;
    },
    action(args) {
      var isLevel = !!args[2];
      var amt = parseInt(args[1]);
      var user = args[3] ? serv.getPlayer(args[3]) : player;
      if (!user) return args[3] + ' is not on this server!';

      if (!isLevel) {
        user.setXp(user.xp + amt);
        player.chat('Gave ' + user.username + ' ' + amt + ' xp');
      } else {
        var currLevel = serv.getXpLevel(player.xp);
        var baseCurrLevel = serv.getBaseXpFromLevel(currLevel);
        var extraXp = player.xp - baseCurrLevel;
        user.setXp(serv.getBaseXpFromLevel(currLevel + amt) + extraXp);
        player.chat('Gave ' + user.username + ' ' + amt + ' levels');
      }
    }
  });
}

module.exports.server = function(serv) {
  serv.distanceToXpLevel = (xp, toLevel) => {
    var level = serv.getXpLevel(xp);
    if (!toLevel) toLevel = level+1;
    var levelBaseXp = serv.getBaseXpFromLevel(level);
    var requiredXp = serv.getXpRequired(level, toLevel);
    return (xp - levelBaseXp) / requiredXp;
  }

  serv.getXpLevel = (xp) => {
    // I have to use quadratic equation to reverse the equation from serv.getBaseXpFromLevel(). Ugh.
    var a;
    var b;
    var c;
    if (xp < 352) { // 352 == Experience at level 16
      a = 1;
      b = 6;
      c = 0;
    } else if (xp < 1507) { // 1507 == Experience at level 31
      a = 2.5;
      b = -40.5;
      c = 360;
    } else { // Level 32+
      a = 4.5;
      b = -162.5;
      c = 2220;
    }
    c -= xp;
    return Math.floor((-b + Math.sqrt(b*b - 4*a*c)) / (2 * a)); // Math class was useful I guess mmph
  }

  serv.getXpRequired = (level, toLevel) => {
    if (!toLevel) toLevel = level + 1;
    return serv.getBaseXpFromLevel(toLevel) - serv.getBaseXpFromLevel(level);
  }

  serv.getBaseXpFromLevel = (level) => {
    // The equations in this function are stupid and directly from the MC Wiki
    // http://minecraft.gamepedia.com/Experience#Leveling_up
    if (level <= 16) {
      return level*level + 6*level;
    } else if (level <= 31) {
      return 2.5*level*level - 40.5*level + 360;
    } else { // 32+
      return 4.5*level*level - 162.5*level + 2220;
    }
  }
}