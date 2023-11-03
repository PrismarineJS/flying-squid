import { getXpLevel, distanceToXpLevel, getBaseXpFromLevel } from '../experience'
import UserError from '../user_error'

export const player = function (player: Player, serv: Server) {
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

export const server = function (serv: Server) {
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
        if (ctx.player) ctx.player.chat('Gave ' + user.username + ' ' + amt + ' xp')
        else serv.info('Gave ' + user.username + ' ' + amt + ' xp')
      } else {
        const currLevel = getXpLevel(user.xp)
        const baseCurrLevel = getBaseXpFromLevel(currLevel)
        const extraXp = user.xp - baseCurrLevel
        user.setXp(getBaseXpFromLevel(currLevel + amt) + extraXp)
        if (ctx.player) ctx.player.chat('Gave ' + user.username + ' ' + amt + ' levels')
        else serv.info('Gave ' + user.username + ' ' + amt + ' levels')
      }
    }
  })
}
declare global {
  interface Player {
    level: number
    "xp": number
    "displayXp": number
    "xpLevel": number
    "sendXp": () => void
    "setXpLevel": (level: any) => void
    "setDisplayXp": () => void
    "setXp": (xp: any, { setLevel, setDisplay, send }?: { setLevel?: boolean | undefined; setDisplay?: boolean | undefined; send?: boolean | undefined }) => void
  }
}
