const Vec3 = require('vec3').Vec3

function generation (options) {
  const { registry } = options
  const Chunk = require('prismarine-chunk')(registry)
  const theFlattening = registry.supportFeature('theFlattening')

  const bottomId = options.bottomId || registry.blocksByName.bedrock.id
  const middleId = options.middleId || registry.blocksByName.dirt.id
  const topId = options.topId || (theFlattening ? registry.blocksByName.grass_block.id : registry.blocksByName.grass.id) // before the flattening the name of grass block is grass
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
          const currentVec = new Vec3(x, y, z)
          if (y === 0) {
            chunk.setBlockType(currentVec, bottomId)
            if (options.bottomData) chunk.setBlockData(currentVec, options.bottomData)
          } else if (y < middleThickness + 1) {
            chunk.setBlockType(currentVec, middleId)
            if (options.middleData) chunk.setBlockData(currentVec, options.middleData)
          } else if (y < middleThickness + 2) {
            chunk.setBlockType(currentVec, topId)
            if (topData) chunk.setBlockData(currentVec, topData)
          }
          chunk.setSkyLight(currentVec, 15)
          chunk.setBiome(currentVec, registry.biomesByName[options.biome ?? 'plains'].id)
        }
      }
    }

    if (debug) { DEBUG_POINTS.forEach(p => chunk.setBlockType(p, 35)) }
    return chunk
  }
  return generateChunk
}

module.exports = generation
