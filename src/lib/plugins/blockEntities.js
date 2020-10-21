const Vec3 = require('vec3').Vec3

const actions = {
  // TODO: add more here
  'minecraft:sign': 9
}

module.exports.player = function (player, serv) {
  serv.putBlockEntity = async ({ world, id, position, extra }) => {
    await serv.removeBlockEntity({ world, position }) // remove the block entity there, if there is one
    const column = await world.getColumnAt(position)
    const data = {
      id: {
        type: 'string',
        value: id
      },
      x: {
        type: 'int',
        value: position.x
      },
      y: {
        type: 'int',
        value: position.y
      },
      z: {
        type: 'int',
        value: position.z
      },
      keepPacked: {
        type: 'byte',
        value: 0
      }
    }
    for (const item of Object.keys(extra)) {
      const type = {
        string: 'string',
        number: 'int'
      }[typeof item]
      data[item] = {
        type,
        value: extra[item]
      }
    }
    column.blockEntities.push(data)

    if (id === 'minecraft:sign' && serv.supportFeature('updateSignPacket')) {
      const packetData = {
        location: position,
        text1: JSON.parse(extra.Text1).text,
        text2: JSON.parse(extra.Text2).text,
        text3: JSON.parse(extra.Text3).text,
        text4: JSON.parse(extra.Text4).text
      }
      player._writeOthersNearby(
        'update_sign',
        packetData
      )
      player._client.write( // not necessary in 1.13+ but still here just in case
        'update_sign',
        packetData
      )
      return
    }

    const packetData = {
      location: position,
      action: actions[id],
      nbtData: {
        type: 'compound',
        name: '',
        value: data
      }
    }
    player._writeOthersNearby(
      'tile_entity_data',
      packetData
    )
    player._client.write( // not necessary in 1.13+ but still here just in case
      'tile_entity_data',
      packetData
    )
  }

  serv.removeBlockEntity = async ({ world, position }) => {
    const column = await world.getColumnAt(position)

    if (!column.blockEntities) column.blockEntities = []

    column.blockEntities = column.blockEntities.filter(item =>
      !(item.x.value === position.x && item.y.value === position.y && item.z.value === position.z)
    )
    world.saveAt(position)
  }

  player._client.on('block_dig', async ({ location, status, face }) => {
    location = new Vec3(location.x, location.y, location.z) // sometimes doesnt work if i dont do this
    const directionVector = directionToVector[face]
    const facedPos = location.plus(directionVector)
    await serv.removeBlockEntity({ world: player.world, position: facedPos })
  })
}

const directionToVector = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]
