module.exports.server = (serv, { version }) => {
  const registry = require('prismarine-registry')(version)

  const oakSign = registry.supportFeature('theFlattening') ? registry.blocksByName.oak_sign : registry.blocksByName.standing_sign
  const oakWallSign = registry.blocksByName.wall_sign

  serv.on('asap', () => {
    if (registry.supportFeature('theFlattening')) {
      const placeHandler = ({ player, placedPosition, direction, properties }) => {
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
      }
      if (registry.supportFeature('multiTypeSigns')) {
        const signTypes = ['oak_sign', 'spruce_sign', 'birch_sign', 'acacia_sign', 'jungle_sign', 'dark_oak_sign']
        signTypes.forEach(type => serv.onItemPlace(type, placeHandler))
      } else {
        serv.onItemPlace('sign', placeHandler)
      }
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
