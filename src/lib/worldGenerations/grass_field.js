const Vec3 = require('vec3').Vec3

function generation ({ version }) {
  const Chunk = require('prismarine-chunk')(version)
  const mcData = require('minecraft-data')(version)
  const versionObject = mcData.version
  const theFlattening = require('./lib/supportFeature')('theFlattening', versionObject.majorVersion)

  function generateSimpleChunk () {
    const chunk = new Chunk()

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        chunk.setBlockType(new Vec3(x, 50, z), theFlattening ? mcData.blocksByName.grass_block.id : mcData.blocksByName.grass.id) // before the flattening the name of grass block is grass
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
