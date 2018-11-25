const Vec3 = require('vec3').Vec3

module.exports.player = function (player, serv) {
  player.changeBlock = async (position, blockType, blockData) => {
    serv.players
      .filter(p => p.world === player.world && player !== p)
      .forEach(p => p.sendBlock(position, blockType, blockData))

    await player.world.setBlockType(position, blockType)
    await player.world.setBlockData(position, blockData)
  }

  player.sendBlock = (position, blockType, blockData) => // Call from player.setBlock unless you want "local" fake blocks
    player.behavior('sendBlock', {
      position: position,
      blockType: blockType,
      blockData: blockData
    }, ({ position, blockType, blockData }) => {
      player._client.write('block_change', {
        location: position,
        type: blockType << 4 | blockData
      })
    })

  player.setBlock = (position, blockType, blockData) => serv.setBlock(player.world, position, blockType, blockData)

  player.commands.add({
    base: 'setblock',
    info: 'set a block at a position',
    usage: '/setblock <x> <y> <z> <id> [data]',
    op: true,
    parse (str) {
      const results = str.match(/^(~|~?-?[0-9]+) (~|~?-?[0-9]+) (~|~?-?[0-9]+) ([0-9]{1,3})(?: ([0-9]{1,3}))?/)
      if (!results) return false
      return results
    },
    action (params) {
      let res = params.slice(1, 4)
      res = res.map((val, i) => serv.posFromString(val, player.position[['x', 'y', 'z'][i]]))
      player.setBlock(new Vec3(res[0], res[1], res[2]).floored(), params[4], params[5] || 0)
    }
  })
}
