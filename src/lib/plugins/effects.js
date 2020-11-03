const { supportedVersions } = require('../version')
const pc = require('prismarine-chat')

module.exports.entity = function (entity, serv) {
  entity.effects = {}
  for (let i = 1; i <= 23; i++) { // 23 in 1.8, 27 in 1.9
    entity.effects[i] = null // Just so we know it's a real potion and not undefined/not existant
  }

  entity.sendEffect = (effectId, { amplifier = 0, duration = 30 * 20, particles = true, whitelist, blacklist = [] } = {}) => {
    if (!whitelist) whitelist = serv.getNearby(entity)
    if (entity.type === 'player' && [1].indexOf(effectId) !== -1) entity.sendAbilities()
    const sendTo = whitelist.filter(p => blacklist.indexOf(p) === -1)
    const data = {
      entityId: entity.id,
      effectId: effectId,
      amplifier: amplifier,
      duration: duration,
      hideParticles: !particles
    }
    serv._writeArray('entity_effect', data, sendTo)
  }

  entity.sendRemoveEffect = (effectId, { whitelist, blacklist = [] } = {}) => {
    if (!whitelist) whitelist = serv.getNearby(entity)
    const sendTo = whitelist.filter(p => blacklist.indexOf(p) === -1)
    serv._writeArray('remove_entity_effect', {
      entityId: entity.id,
      effectId: effectId
    }, sendTo)
  }

  entity.addEffect = (effectId, opt = {}) => {
    const amp = typeof opt.amplifier === 'undefined' ? 0 : opt.amplifier
    if (!entity.effects[effectId] || opt.override || amp < entity.effects[effectId].amplifier) {
      entity.effects[effectId] = {
        amplifier: opt.amplifier || 0,
        duration: opt.duration || 30 * 20,
        particles: opt.particles || true,
        end: Date.now() + (opt.duration || 30 * 20) * 1000 / 20, // 1000/20 === convert from ticks to milliseconds,
        timeout: setTimeout(() => entity.removeEffect(effectId), (opt.duration || 30 * 20) * 1000 / 20)
      }
      entity.sendEffect(effectId, opt)
      return true
    } else return false
  }

  entity.removeEffect = (effectId, opt) => {
    clearTimeout(entity.effects[effectId].timeout)
    entity.effects[effectId] = null
    entity.sendRemoveEffect(effectId, opt)
  }
}

module.exports.server = function (serv, { version }) {
  const ChatMessage = pc(version)

  serv.commands.add({
    base: 'effect',
    info: 'Give player an effect',
    usage: '/effect <player> <effect> [seconds] [amplifier] [hideParticles]',
    onlyPlayer: true,
    parse (str) {
      return str.match(/(.+?) (\d+)(?: (\d+))?(?: (\d+))?(?: (true|false))?|.*? clear/) || false
    },
    action (params, ctx) {
      const targets = ctx.player ? ctx.player.selectorString(params[1]) : serv.selectorString(params[1])
      const chatSelect = (targets.length === 1 ? (targets[0].type === 'player' ? targets[0].username : 'entity') : 'entities')
      if (params[2] === 'clear') {
        targets.forEach(e => Object.keys(e.effects).forEach(effectId => {
          if (e.effects[effectId] !== null) e.removeEffect(effectId)
        }))

        let removeMsg
        if (supportedVersions.indexOf(version) < 5) {
          removeMsg = {
            translate: 'commands.effect.success.removed.all'
          }
        } else {
          removeMsg = { // anyway used for multiple
            translate: 'commands.effect.clear.everything.success.single',
            with: [String(chatSelect)]
          }
        }
        if (ctx.player) ctx.player.chat(removeMsg)
        else serv.log(new ChatMessage(removeMsg))
      } else {
        targets.forEach(e => {
          const effId = parseInt(params[2])
          if (e.effects[effId]) {
            e.removeEffect(effId)
          }
          e.addEffect(effId, {
            amplifier: parseInt(params[4]) || 0,
            duration: parseInt(params[3]) * 20 || 30 * 20,
            particles: params[5] !== 'true' // hidesParticles vs particles (i.e. "showParticles")
          })
        })

        let giveMsgs
        if (supportedVersions.indexOf(version) < 5) {
          giveMsgs = {
            success: {
              translate: 'commands.effect.success',
              with: [String(params[2]), String((params[4] || 0)), String(chatSelect), String((parseInt(params[3]) || 30))]
            }
          }
        } else {
          giveMsgs = {
            success: {
              translate: 'commands.effect.give.success.single',
              with: [String(params[2]), String(params[1])]
            }
          }
        }

        if (ctx.player) {
          ctx.player.chat(giveMsgs.success)
        } else {
          serv.info(new ChatMessage(giveMsgs.success))
        }
      }
    }
  })
}
