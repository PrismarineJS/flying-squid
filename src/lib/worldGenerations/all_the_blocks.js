const Vec3 = require('vec3').Vec3

function generation ({ version }) {
  const Chunk = require('prismarine-chunk')(version)
  const blocks = require('minecraft-data')(version).blocks

  function generateSimpleChunk () {
    const chunk = new Chunk()

    let i = 2
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        let y
        for (y = 47; y <= 50; y++) {
          chunk.setBlockType(new Vec3(x, y, z), i)
          i = (i + 1) % Object.keys(blocks).length
        }
        for (y = 0; y < 256; y++) {
          chunk.setSkyLight(new Vec3(x, y, z), 15)
        }
      }
    }
    return chunk
  }
  return generateSimpleChunk
}

module.exports = generation
