const Vec3 = require('vec3').Vec3

function generation ({ version }) {
  const Chunk = require('prismarine-chunk')(version)

  function generateSimpleChunk () {
    const chunk = new Chunk()

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        chunk.setBlockType(new Vec3(x, 50, z), 2)
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
