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

  player.commands.add({
    base: 'xp',
    info: 'Give yourself experience',
    usage: '/xp <amount> [player] OR /xp <amount>L [player]',
    op: true,
    parse (str) {
      return str.match(/(-?\d+)(L)? ?([a-zA-Z0-9_]+)?/) || false
    },
    action (args) {
      const isLevel = !!args[2]
      const amt = parseInt(args[1])
      const user = args[3] ? serv.getPlayer(args[3]) : player
      if (!user) return args[3] + ' is not on this server!'

      if (!isLevel) {
        user.setXp(user.xp + amt)
        player.chat('Gave ' + user.username + ' ' + amt + ' xp')
      } else {
        const currLevel = getXpLevel(player.xp)
        const baseCurrLevel = getBaseXpFromLevel(currLevel)
        const extraXp = player.xp - baseCurrLevel
        user.setXp(getBaseXpFromLevel(currLevel + amt) + extraXp)
        player.chat('Gave ' + user.username + ' ' + amt + ' levels')
      }
    }
  })
}
