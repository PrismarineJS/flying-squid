const fs = require('fs')
const Vec3 = require('vec3').Vec3
const { promisify } = require('util')
const nbt = require('prismarine-nbt')

const fsReadFile = promisify(fs.readFile)
const nbtParse = promisify(nbt.parse)

module.exports = { read }

const defaultPlayer = {
  health: 20,
  food: 20,
  heldItemSlot: 0
}

async function read (uuid, spawnPoint, worldFolder) {
  try {
    const playerDataFile = await fsReadFile(`${worldFolder}/playerdata/${uuid}.dat`)
    const playerData = (await nbtParse(playerDataFile)).value
    return {
      player: {
        health: playerData.Health.value,
        food: playerData.foodLevel.value,
        gameMode: playerData.playerGameType.value,
        xp: playerData.XpTotal.value,
        heldItemSlot: playerData.SelectedItemSlot.value,
        position: new Vec3(playerData.Pos.value.value[0], playerData.Pos.value.value[1], playerData.Pos.value.value[2]),
        yaw: playerData.Rotation.value.value[0],
        pitch: playerData.Rotation.value.value[1],
        onGround: Boolean(playerData.OnGround.value)
      },
      inventory: playerData.Inventory.value.value
    }
  } catch (e) {
    return {
      player: { ...defaultPlayer, ...{ position: spawnPoint.clone() } },
      inventory: []
    }
  }
}
