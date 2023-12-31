const Vec3 = require('vec3').Vec3
const UserError = require('flying-squid').UserError
const colors = require('colors')

module.exports.player = function (player, serv) {
  function attackEntity (entityId) {
    const attackedEntity = serv.entities[entityId]
    if (!attackedEntity || (attackedEntity.gameMode !== 0 && attackedEntity.type === 'player')) return

    player.behavior('attack', {
      attackedEntity,
      velocity: attackedEntity.position.minus(player.position).plus(new Vec3(0, 0.5, 0)).scaled(5)
    }, (o) => o.attackedEntity.takeDamage(o))
  }

  player._client.on('use_entity', ({ mouse, target } = {}) => {
    if (!serv.entities[target]) {
      let dragon = target - 1
      while (dragon >= target - 7 && !serv.entities[dragon]) {
        dragon--
      }
      if (serv.entities[dragon] && serv.entities[dragon].entityType === 63) { target = dragon }
    }
    if (mouse === 1) { attackEntity(target) }
  })
}

module.exports.entity = function (entity, serv) {
  entity.takeDamage = ({ sound = 'game.player.hurt', damage = 1, velocity = new Vec3(0, 0, 0), maxVelocity = new Vec3(4, 4, 4), animation = true }) => {
    entity.updateHealth(entity.health - damage)
    serv.playSound(sound, entity.world, entity.position)

    entity.sendVelocity(velocity, maxVelocity)

    if (entity.health <= 0) {
      if (animation) {
        entity._writeOthers('entity_status', {
          entityId: entity.id,
          entityStatus: 3
        })
      }
      if (entity.type !== 'player') { delete serv.entities[entity.id] }
    } else if (animation) {
      entity._writeOthers('animation', {
        entityId: entity.id,
        animation: 1
      })
    }
  }

  if (entity.type !== 'player') {
    entity.updateHealth = (health) => {
      entity.health = health
    }
  }
}

module.exports.server = function (serv) {
  serv.commands.add({
    base: 'kill',
    info: 'Kill entities',
    usage: '/kill <selector>|<player>',
    tab: ['player'],
    parse (str) {
      return str || false
    },
    action (sel, ctx) {
      if (sel !== '') {
        if (serv.getPlayer(sel) !== null) {
          serv.getPlayer(sel).takeDamage({ damage: 20 })
          serv.info(`Killed ${colors.bold(sel)}`)
        } else {
          const arr = serv.selectorString(sel)
          if (arr.length === 0) throw new UserError('Could not find player')
          arr.forEach(entity => {
            entity.takeDamage({ damage: 20 })
            serv.info(`Killed ${colors.bold(entity.type === 'player' ? entity.username : entity.name)}`)
          })
        }
      } else {
        if (ctx.player) ctx.player.takeDamage({ damage: 20 })
        else serv.err('Can\'t kill console')
      }
    }
  })
}
