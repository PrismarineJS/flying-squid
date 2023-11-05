import { Vec3 } from 'vec3'

import colors from 'colors'
import UserError from '../user_error'

export const player = function (player: Player, serv: Server) {
  function attackEntity (entityId) {
    const attackedEntity = serv.entities[entityId]
    const attackedPlayer = attackedEntity.type === 'player' ? attackedEntity as Player : undefined
    if (!attackedEntity || (attackedPlayer && attackedPlayer.gameMode !== 0)) return

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

export const entity = function (entity: Entity, serv: Server) {
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

export const server = function (serv: Server) {
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
            serv.info(`Killed ${colors.bold(entity.type === 'player' ? (entity as Player).username : entity.name ?? '<unknown>')}`)
          })
        }
      } else {
        if (ctx.player) ctx.player.takeDamage({ damage: 20 })
        else serv.err('Can\'t kill console')
      }
    }
  })
}
declare global {
  interface Entity {
    /** How many half-hearts an entity has of health (e.g. Player has 20). Not really used for objects, only players and mobs. */
    health: number
    /** @internal */
    updateHealth: (health: number) => void
    /** * sound: Sound to play (default is game.player.hurt),    * * damage: Damage to deal (default is based off player's weapon, player's potions, attackEntity's potions, and attackedEntity armor),    * * velocity: Which way should attackedEntity move when hit,    * * maxVelocity: maxVelocity from consecutive hits,    * * animation: Play death/hit animation    */
    "takeDamage": ({ sound, damage, velocity, maxVelocity, animation }: { sound?: string | undefined; damage?: number | undefined; velocity?: any; maxVelocity?: any; animation?: boolean | undefined }) => void
    /** @internal */
    "kill": (options?: {}) => void
  }
}
