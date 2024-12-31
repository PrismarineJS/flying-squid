const Vec3 = require('vec3').Vec3

function generation ({ registry }) {
  const Chunk = require('prismarine-chunk')(registry)
  const theFlattening = registry.supportFeature('theFlattening')

  function generateSimpleChunk () {
    const chunk = new Chunk()

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        chunk.setBlockType(new Vec3(x, 50, z), theFlattening ? registry.blocksByName.grass_block.id : registry.blocksByName.grass.id) // before the flattening the name of grass block is grass
        if (theFlattening) chunk.setBlockData(new Vec3(x, 50, z), 1) // before the flattening there is no data
        for (let y = 0; y < 256; y++) {
          chunk.setSkyLight(new Vec3(x, y, z), 15)
        }
      }
    }

    return chunk
  }
  return generateSimpleChunk
}

module.exports = generation
