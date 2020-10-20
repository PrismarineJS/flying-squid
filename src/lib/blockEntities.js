const Vec3 = require('vec3').Vec3

async function putBlockEntity ({ world, id, position, extra }) {
  await removeBlockEntity({ world, position }) // remove the block entity there, if there is one
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
}

async function removeBlockEntity ({ world, position }) {
  const column = await world.getColumnAt(position)
  console.log(`previous block entities from ${position.x}, ${position.y}, ${position.z}:`, column.blockEntities)

  if (!column.blockEntities) column.blockEntities = []

  column.blockEntities = column.blockEntities.filter(item =>
    !(item.x.value == position.x && item.y.value == position.y && item.z.value == position.z)
  )
  console.log('new block entities:', column.blockEntities)
  world.saveAt(position)
}

module.exports.player = function (player, serv) {
  player._client.on('block_dig', async ({ location, status, face }) => {
    console.log('block dig')
    const facedPos = location.plus(directionVector)
    await removeBlockEntity({ world: player._client.world, location })
  })
}

const directionToVector = [new Vec3(0, -1, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(1, 0, 0)]

module.exports = { putBlockEntity, removeBlockEntity }
