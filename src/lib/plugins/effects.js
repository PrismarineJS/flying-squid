const { pascalCase } = require('change-case')
const UserError = require('../user_error')
const { skipMcPrefix } = require('../utils')

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
      effectId,
      amplifier,
      duration,
      hideParticles: !particles
    }
    serv._writeArray('entity_effect', data, sendTo)
  }

  entity.sendRemoveEffect = (effectId, { whitelist, blacklist = [] } = {}) => {
    if (!whitelist) whitelist = serv.getNearby(entity)
    const sendTo = whitelist.filter(p => blacklist.indexOf(p) === -1)
    serv._writeArray('remove_entity_effect', {
      entityId: entity.id,
      effectId
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

module.exports.server = function (serv, options) {
  serv.commands.add({
    base: 'effect',
    info: 'Give player an effect',
    usage: '/effect <player> <effect> [seconds] [amplifier] [hideParticles]',
    tab: ['player', 'effect', 'number', 'number', 'boolean'],
    onlyPlayer: true,
    parse (str) {
      return str.match(/(.+?) ([\d\w_]+)(?: (\d+|))?(?: (\d+))?(?: (true|false))?|.*? clear/) || false
    },
    action (params, ctx) {
      const targets = ctx.player ? ctx.player.selectorString(params[1]) : serv.selectorString(params[1])
      if (params[2] === 'clear') {
        targets.forEach(e => Object.keys(e.effects).forEach(effectId => {
          if (e.effects[effectId] !== null) e.removeEffect(effectId)
        }))
      } else {
        targets.forEach(e => {
          let effId = parseInt(params[2])
          if (isNaN(effId)) {
            const mcData = require('minecraft-data')(options.version)
            const effectNamePascal = pascalCase(skipMcPrefix(params[2]))
            const effect = mcData.effectsByName[effectNamePascal]
            if (!effect) throw new UserError(`Unknown effect ${params[2]}}`)
            effId = effect.id
          }
          if (e.effects[effId]) {
            e.removeEffect(effId)
          }
          e.addEffect(effId, {
            amplifier: parseInt(params[4]) || 0,
            duration: parseInt(params[3]) * 20 || 30 * 20,
            particles: params[5] !== 'true' // hidesParticles vs particles (i.e. "showParticles")
          })
        })
      }
      const chatSelect = (targets.length === 1 ? (targets[0].type === 'player' ? targets[0].username : 'entity') : 'entities')
      if (params[2] === 'clear') {
        if (ctx.player) ctx.player.chat('Remove all effects from ' + chatSelect + '.')
        else serv.info('Remove all effects from ' + chatSelect + '.')
      } else {
        if (ctx.player) {
          ctx.player.chat('Gave ' + chatSelect + ' effect ' + params[2] + '(' + (params[4] || 0) + ') for ' +
                        (parseInt(params[3]) || 30) + ' seconds')
        } else {
          serv.info('Gave ' + chatSelect + ' effect ' + params[2] + '(' + (params[4] || 0) + ') for ' +
                        (parseInt(params[3]) || 30) + ' seconds')
        }
      }
    }
  })
}
