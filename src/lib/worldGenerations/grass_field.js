const Vec3 = require('vec3').Vec3
const emptyGen = require('./empty')

function generation ({ version }) {
  const registry = require('prismarine-registry')(version)
  const theFlattening = registry.supportFeature('theFlattening')
  const generateEmptyChunk = emptyGen({ version })

  function generateSimpleChunk () {
    const chunk = generateEmptyChunk()

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        chunk.setBlockType(new Vec3(x, 50, z), theFlattening ? registry.blocksByName.grass_block.id : registry.blocksByName.grass.id) // before the flattening the name of grass block is grass
        if (theFlattening) chunk.setBlockData(new Vec3(x, 50, z), 1) // before the flattening there is no data
        for (let y = chunk.minY ?? 0; y < chunk.worldHeight ?? 256; y++) {
          chunk.setSkyLight(new Vec3(x, y, z), 15)
        }
      }
    }

    return chunk
  }
  return generateSimpleChunk
}

module.exports = generation
