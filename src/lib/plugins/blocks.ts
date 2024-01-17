import { skipMcPrefix } from '../utils'

import { Vec3 } from 'vec3'

export const player = function (player: Player, serv: Server) {
  player.changeBlock = async (position, blockType, blockData) => {
    serv.players
      .filter(p => p.world === player.world && player !== p)
      .forEach(p => p.sendBlock(position, blockType/* , blockData */)) // todo

    await player.world.setBlockType(position, blockType)
    await player.world.setBlockData(position, blockData)

    if (blockType === 0) serv.notifyNeighborsOfStateChange(player.world, position, serv.tickCount, serv.tickCount, true)
    else serv.updateBlock(player.world, position, serv.tickCount, serv.tickCount, true)
  }

  player.sendBlock = async (position, blockStateId) => // Call from player.setBlock unless you want "local" fake blocks
    await player.behavior('sendBlock', {
      position
    }, ({ position }) => {
      player._client.write('block_change', {
        location: position,
        type: blockStateId
      })
    })

  player.setBlock = async (position, stateId) => await serv.setBlock(player.world, position, stateId)

  player.sendBlockAction = async (position, actionId, actionParam, blockType) => {
    if (!blockType) {
      const location = new Vec3(position.x, position.y, position.z)
      blockType = await player.world.getBlockType(location)
    }

    player.behavior('sendBlockAction', {
      position,
      blockType,
      actionId,
      actionParam
    }, ({ position, blockType, actionId, actionParam }) => {
      player._client.write('block_action', {
        location: position,
        byte1: actionId,
        byte2: actionParam,
        blockId: blockType
      })
    })
  }

  player.setBlockAction = async (position, actionId, actionParam) => await serv.setBlockAction(player.world, position, actionId, actionParam)
}

export const server = function (serv: Server, { version }: Options) {
  const registry = require('prismarine-registry')(version)
  const blocks = registry.blocks

  const postFlatenning = registry.supportFeature('theFlattening')
  // todo implement!
  const usage = postFlatenning ? '/setblock <x> <y> <z> <id> [data]' : '/setblock <x> <y> <z> <block> |replace|keep|destroy|'
  serv.commands.add({
    base: 'setblock',
    info: 'set a block at a position',
    usage,
    op: true,
    tab: ['blockX', 'blockY', 'blockZ', 'block', 'number'],
    parse (str) {
      const results = str.match(/^(~|~?-?[0-9]+) (~|~?-?[0-9]+) (~|~?-?[0-9]+) ([\w_:0-9]+)(?: ([0-9]{1,3}))?/)
      // todo parse properties & nbt!
      if (results == null) return false
      return results
    },
    action (params, ctx) {
      let res = params.slice(1, 4)
      if (ctx.player != null) res = res.map((val, i) => serv.posFromString(val, ctx.player!.position[['x', 'y', 'z'][i]]))
      else res = res.map((val, i) => serv.posFromString(val, new Vec3(0, 128, 0)[['x', 'y', 'z'][i]]))

      const blockParam = params[4]
      const id = isNaN(+blockParam) ? registry.blocksByName[skipMcPrefix(blockParam)]?.id : +blockParam
      const data = parseInt(params[5] || '0', 10)
      const stateId = postFlatenning
        ? data ? (blocks[id].minStateId! + data) : blocks[id].defaultState!
        : (id << 4 | data)

      if (ctx.player != null) ctx.player.setBlock(new Vec3(+res[0], +res[1], +res[2]).floored(), stateId)
      else serv.setBlock(serv.overworld, new Vec3(+res[0], +res[1], +res[2]).floored(), stateId)
    }
  })

  serv.commands.add({
    base: 'setblockaction',
    info: 'set a block action',
    usage: '/setblockaction <x> <y> <z> <actionId> <actionParam>',
    op: true,
    parse (str) {
      const results = str.match(/^(-?[0-9]+) (-?[0-9]+) (-?[0-9]+) (-?[0-9]+) (-?[0-9]+)?/)
      if (results == null) return false
      return results
    },
    action (params, ctx) {
      if (ctx.player != null) ctx.player.setBlockAction(new Vec3(+params[1], +params[2], +params[3]).floored(), +params[4], params[5])
      else serv.setBlockAction(serv.overworld, new Vec3(+params[1], +params[2], +params[3]).floored(), +params[4], params[5])
    }
  })
}
declare global {
  interface Player {
    /** change the block at position `position` to `blockType` and `blockData`,    * ,    * this will not change the block for the user himself. It is mainly useful when a user places a block,    * and only needs to send it to other players on the server    */
    'changeBlock': (position: any, blockType: any, blockData: any) => Promise<void>
    /** change the block at position `position` to `blockType` and `blockData`,    * ,    * this will not make any changes on the server's world and only sends it to the user as a "fake" or "local" block    */
    'sendBlock': (position: any, blockStateId: any) => any
    /** Saves block in world and sends block update to all players of the same world. */
    'setBlock': (position: any, stateId: any) => any
    /** Set the block action at position `position` to `actionId` and `actionParam`.,    * ,    * ``blockType`` is only required when the block at the location is a fake block.,    * This will only be caused by using ``player.sendBlock``.,    * ,    * This will not make any changes to the server's world and only sends it to the user as a local action.    */
    'sendBlockAction': (position: any, actionId: any, actionParam: any, blockType: any) => Promise<void>
    /** Sets a block action and sends the block action to all players in the same world.,    * ,    * This will not make any changes to the server's world    */
    'setBlockAction': (position: any, actionId: any, actionParam: any) => any
  }
}
