module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  const mobs = mcData.mobs

  function getEntID(entName) { // 1.9x, 1.10x and 1.11x
    let foundID = ''

    Object.keys(mobs).forEach(mobID => {
      const mob = mobs[mobID]
      if (mob.name === entName) {
        foundID = mobID
      }
    })

    return foundID
  }

  function getEntIDmc(entName) { // 1.12x [working 2021]
    let foundID = ''

    Object.keys(mobs).forEach(mobID => {
      const mob = mobs[mobID]
      if ('minecraft:' + mob.name === entName) {
        foundID = mobID
      }
    })

    return foundID
  }

  serv.on('asap', () => {
    if (serv.supportFeature('theFlattening')) {
      for (const mob of Object.values(mobs)) {
        const spawnEgg = mcData.itemsByName[mob.name + '_spawn_egg']
        if (spawnEgg) {
          serv.onItemPlace(spawnEgg.name, ({ player, placedPosition }) => {
            serv.spawnMob(mob.id, player.world, placedPosition)
            return { id: -1, data: 0 }
          })
        }
      }
    } else {
	if (version === '1.12.2') {
		serv.onItemPlace('spawn_egg', ({ item, player, placedPosition }) => {
		serv.spawnMob(getEntIDmc(item.nbt.value.EntityTag.value.id.value), player.world, placedPosition)
		return { id: -1, data: 0 }
		})
	} else {
		if (version === '1.8.8') {
			serv.onItemPlace('spawn_egg', ({ item, player, placedPosition }) => {
			serv.spawnMob(item.metadata, player.world, placedPosition)
			return { id: -1, data: 0 }
		})
		} else {
			serv.onItemPlace('spawn_egg', ({ item, player, placedPosition }) => {
			serv.spawnMob(getEntID(item.nbt.value.EntityTag.value.id.value), player.world, placedPosition)
			return { id: -1, data: 0 }
		})
		}
	}
	}
  })
}
