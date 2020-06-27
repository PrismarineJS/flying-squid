const UserError = require('flying-squid').UserError

const { distanceToXpLevel, getXpLevel, getBaseXpFromLevel } = require('flying-squid').experience

module.exports.player = function (player, serv) {
  player.xp = 0
  player.displayXp = 0
  player.xpLevel = 0

  player.sendXp = () => {
    player._client.write('experience', {
      experienceBar: player.displayXp,
      level: player.level,
      totalExperience: player.xp
    })
  }

  player.setXpLevel = (level) => {
    player.xpLevel = level
    player.sendXp()
  }

  player.setDisplayXp = () => {
    player.displayXp = Math.max(0, Math.min(1, player.displayXp))
    player.sendXp()
  }

  player.setXp = (xp, { setLevel = true, setDisplay = true, send = true } = {}) => {
    player.xp = xp
    if (setLevel) player.level = getXpLevel(xp)
    if (setDisplay) player.displayXp = distanceToXpLevel(xp)
    if (send) player.sendXp()
  }
}

module.exports.server = function (serv) {
  serv.commands.add({
    base: 'xp',
    info: 'Give yourself experience',
    usage: '/xp <amount> [player] OR /xp <amount>L [player]',
    op: true,
    parse (str) {
      return str.match(/(-?\d+)(L)? ?([a-zA-Z0-9_]+)?/) || false
    },
    action (args, ctx) {
      const isLevel = !!args[2]
      const amt = parseInt(args[1])
      if (!ctx.player && !args[3]) throw new UserError('Console can\'t give itself experience.')
      const user = args[3] ? serv.getPlayer(args[3]) : ctx.player
      if (!user) throw new UserError(args[3] + ' is not on this server!')

      if (!isLevel) {
        user.setXp(user.xp + amt)
<<<<<<< HEAD
        if(ctx.player) ctx.player.chat('Gave ' + user.username + ' ' + amt + ' xp')
=======
        if (ctx.player) ctx.player.chat('Gave ' + user.username + ' ' + amt + ' xp')
>>>>>>> 50a18752444823aed563fbc6d6747277ba82642b
        else serv.info('Gave ' + user.username + ' ' + amt + ' xp')
      } else {
        const currLevel = getXpLevel(user.xp)
        const baseCurrLevel = getBaseXpFromLevel(currLevel)
        const extraXp = user.xp - baseCurrLevel
        user.setXp(getBaseXpFromLevel(currLevel + amt) + extraXp)
<<<<<<< HEAD
        if(ctx.player) ctx.player.chat('Gave ' + user.username + ' ' + amt + ' levels')
=======
        if (ctx.player) ctx.player.chat('Gave ' + user.username + ' ' + amt + ' levels')
>>>>>>> 50a18752444823aed563fbc6d6747277ba82642b
        else serv.info('Gave ' + user.username + ' ' + amt + ' levels')
      }
    }
  })
}
