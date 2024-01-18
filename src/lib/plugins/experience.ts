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
    /** @internal */
    level: number
    /** Total experience the player has (int). Set this using player.setXp() */
    "xp": number
    /** Number from 0 to 1.0 representing the progress bar at the bottom of the player's screen. Set this with player.setDisplayXp() */
    "displayXp": number
    /** Level of xp the player has. Set this with player.setXpLevel() */
    "xpLevel": number
    /** Updates the player's xp based on player.xp, player.displayXp, and player.xpLevel */
    "sendXp": () => void
    /** Sets and sends the player's new level */
    "setXpLevel": (level: any) => void
    /** Sets and sends the player's new display amount. num should be from 0 to 1.0 */
    'setDisplayXp': () => void
    /** Sets the player's XP level. Options:
     * - setLevel: Calculate and set player.level (default: true)
     * - setDisplay: Calculate and set player.displayXp (default: true)
     * - send: Send xp packet (default: true)
     */
    'setXp': (xp: any, { setLevel, setDisplay, send }?: { setLevel?: boolean | undefined, setDisplay?: boolean | undefined, send?: boolean | undefined }) => void
  }
}
