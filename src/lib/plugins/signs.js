const Vec3 = require('vec3').Vec3

module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)

  serv.on('asap', () => {
    if (serv.supportFeature('theFlattening')) {
      const placeHandler = ({ player, placedPosition, direction, properties, item }) => {
        if (direction === 0) return { id: -1, data: 0 }
        const block = mcData.blocksByName[item.name]
        if (direction !== 1) {
          properties.facing = ['north', 'south', 'west', 'east'][direction - 2]
        }

        player._client.write('open_sign_entity', {
          location: placedPosition
        })

        const data = serv.setBlockDataProperties(block.defaultState - block.minStateId, block.states, properties)
        return { id: block.id, data }
      }
      if (serv.supportFeature('multiTypeSigns')) {
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
          return { id: mcData.blocksByName.standing_sign.id, data: properties.rotation }
        }
        return { id: mcData.blocksByName.wall_sign.id, data: direction }
      })
    }
  })
}

module.exports.player = function (player, serv) {
  player._client.on('update_sign', async ({ location, text1, text2, text3, text4 }) => {
    const position = new Vec3(location.x, location.y, location.z)

    await serv.putBlockEntity({
      world: player.world,
      id: 'minecraft:sign',
      position,
      extra: {
        Color: 'black',
        Text1: JSON.stringify({ text: text1 }),
        Text2: JSON.stringify({ text: text2 }),
        Text3: JSON.stringify({ text: text3 }),
        Text4: JSON.stringify({ text: text4 })
      }
    })
  })
}
