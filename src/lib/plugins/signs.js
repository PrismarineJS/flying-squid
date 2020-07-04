module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)

  const oakSign = serv.supportFeature('theFlattening') ? mcData.blocksByName.sign : mcData.blocksByName.standing_sign
  const oakWallSign = mcData.blocksByName.wall_sign

  serv.on('asap', () => {
    if (serv.supportFeature('theFlattening')) {
      serv.onItemPlace('sign', ({ player, placedPosition, direction, properties }) => {
        if (direction === 0) return { id: -1, data: 0 }
        let block = oakSign
        if (direction !== 1) {
          block = oakWallSign
          properties.facing = ['north', 'south', 'west', 'east'][direction - 2]
        }

        player._client.write('open_sign_entity', {
          location: placedPosition
        })

        const data = serv.setBlockDataProperties(block.defaultState - block.minStateId, block.states, properties)
        return { id: block.id, data }
      })
    } else {
      serv.onItemPlace('sign', ({ player, placedPosition, direction, properties }) => {
        if (direction === 0) return { id: -1, data: 0 }

        player._client.write('open_sign_entity', {
          location: placedPosition
        })

        if (direction === 1) {
          return { id: oakSign.id, data: properties.rotation }
        }
        return { id: oakWallSign.id, data: direction }
      })
    }
  })
}

module.exports.player = function (player) {
// WIP: temporary removed
}
