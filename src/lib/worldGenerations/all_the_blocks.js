const Vec3 = require('vec3').Vec3
const emptyGen = require('./empty')

function generation ({ version }) {
  const registry = require('prismarine-registry')(version)
  const generateEmptyChunk = emptyGen({ version })

  function generateSimpleChunk () {
    const chunk = generateEmptyChunk()

    let i = 2
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        let y
        for (y = 47; y <= 50; y++) {
          chunk.setBlockType(new Vec3(x, y, z), i)
          i = (i + 1) % Object.keys(registry.blocks).length
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
