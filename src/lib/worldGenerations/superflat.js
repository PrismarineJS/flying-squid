const Vec3 = require('vec3').Vec3

function generation (options = {}) {
  const Chunk = require('prismarine-chunk')(options.version)
  const mcData = require('minecraft-data')(options.version)
  const version = mcData.version
  const theFlattening = require('../supportFeature')('theFlattening', version.majorVersion)

  const bottomId = options.bottomId || mcData.blocksByName.bedrock.id
  const middleId = options.middleId || mcData.blocksByName.dirt.id
  const topId = options.topId || (theFlattening ? mcData.blocksByName.grass_block.id : mcData.blocksByName.grass.id) // before the flattening the name of grass block is grass
  const topData = options.topData || (theFlattening ? 1 : undefined) // by default the data of grass block is 0 which is snowy, before the flattening there is no data
  const middleThickness = options.middleThickness || 3
  const debug = options.debug || false

  function generateChunk () {
    const chunk = new Chunk()
    const height = middleThickness + 1
    const DEBUG_POINTS = [new Vec3(0, height, 0), new Vec3(15, height, 0), new Vec3(0, height, 15), new Vec3(15, height, 15)]
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y < 256; y++) {
          if (y === 0) {
            chunk.setBlockType(new Vec3(x, y, z), bottomId)
            if (options.bottomData) chunk.setBlockData(new Vec3(x, y, z), options.bottomData)
          } else if (y < middleThickness + 1) {
            chunk.setBlockType(new Vec3(x, y, z), middleId)
            if (options.middleData) chunk.setBlockData(new Vec3(x, y, z), options.middleData)
          } else if (y < middleThickness + 2) {
            chunk.setBlockType(new Vec3(x, y, z), topId)
            if (topData) chunk.setBlockData(new Vec3(x, y, z), topData)
          }
          chunk.setSkyLight(new Vec3(x, y, z), 15)
        }
      }
    }

    if (debug) { DEBUG_POINTS.forEach(p => chunk.setBlockType(p, 35)) }
    return chunk
  }
  return generateChunk
}

module.exports = generation
