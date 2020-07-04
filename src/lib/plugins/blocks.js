const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv) {
  player.changeBlock = async (position, blockType, blockData) => {
    serv.players
      .filter(p => p.world === player.world && player !== p)
      .forEach(p => p.sendBlock(position, blockType, blockData))

    await player.world.setBlockType(position, blockType)
    await player.world.setBlockData(position, blockData)

    if (blockType === 0) serv.notifyNeighborsOfStateChange(player.world, position, serv.tickCount, serv.tickCount, true)
    else serv.updateBlock(player.world, position, serv.tickCount, serv.tickCount, true)
  }

  player.sendBlock = (position, blockStateId) => // Call from player.setBlock unless you want "local" fake blocks
    player.behavior('sendBlock', {
      position: position
    }, ({ position }) => {
      player._client.write('block_change', {
        location: position,
        type: blockStateId
      })
    })

  player.setBlock = (position, stateId) => serv.setBlock(player.world, position, stateId)

  player.sendBlockAction = async (position, actionId, actionParam, blockType) => {
    if (!blockType) {
      const location = new Vec3(position.x, position.y, position.z)
      blockType = await player.world.getBlockType(location)
    }

    player.behavior('sendBlockAction', {
      position: position,
      blockType: blockType,
      actionId: actionId,
      actionParam: actionParam
    }, ({ position, blockType, actionId, actionParam }) => {
      player._client.write('block_action', {
        location: position,
        byte1: actionId,
        byte2: actionParam,
        blockId: blockType
      })
    })
  }

  player.setBlockAction = (position, actionId, actionParam) => serv.setBlockAction(player.world, position, actionId, actionParam)
}

module.exports.server = function (serv, { version }) {
  const mcData = require('minecraft-data')(version)
  const blocks = mcData.blocks

  serv.commands.add({
    base: 'setblock',
    info: 'set a block at a position',
    usage: '/setblock <x> <y> <z> <id> [data]',
    op: true,
    tab: ['blockX', 'blockY', 'blockZ', 'number'],
    parse (str) {
      const results = str.match(/^(~|~?-?[0-9]+) (~|~?-?[0-9]+) (~|~?-?[0-9]+) ([0-9]{1,3})(?: ([0-9]{1,3}))?/)
      if (!results) return false
      return results
    },
    action (params, ctx) {
      let res = params.slice(1, 4)
      if (ctx.player) res = res.map((val, i) => serv.posFromString(val, ctx.player.position[['x', 'y', 'z'][i]]))
      else res = res.map((val, i) => serv.posFromString(val, new Vec3(0, 128, 0)[['x', 'y', 'z'][i]]))

      const id = parseInt(params[4], 10)
      const data = parseInt(params[5] || 0, 10)
      const stateId = serv.supportFeature('theFlattening') ? (blocks[id].minStateId + data) : (id << 4 | data)

      if (ctx.player) ctx.player.setBlock(new Vec3(res[0], res[1], res[2]).floored(), stateId)
      else serv.setBlock(serv.overworld, new Vec3(res[0], res[1], res[2]).floored(), stateId)
    }
  })

  serv.commands.add({
    base: 'setblockaction',
    info: 'set a block action',
    usage: '/setblockaction <x> <y> <z> <actionId> <actionParam>',
    op: true,
    parse (str) {
      const results = str.match(/^(-?[0-9]+) (-?[0-9]+) (-?[0-9]+) (-?[0-9]+) (-?[0-9]+)?/)
      if (!results) return false
      return results
    },
    action (params, ctx) {
      if (ctx.player) ctx.player.setBlockAction(new Vec3(params[1], params[2], params[3]).floored(), params[4], params[5])
      else serv.setBlockAction(serv.overworld, new Vec3(params[1], params[2], params[3]).floored(), params[4], params[5])
    }
  })
}
