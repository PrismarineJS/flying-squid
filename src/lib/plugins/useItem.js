module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)
  const mobs = mcData.mobs

  function getEntID (entName) {
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
      serv.onItemPlace('spawn_egg', ({ heldItem, player, placedPosition }) => {
        serv.spawnMob(getEntID(heldItem.nbt.value.EntityTag.value.id.value), player.world, placedPosition)
        return { id: -1, data: 0 }
      })
    }
  })
}
