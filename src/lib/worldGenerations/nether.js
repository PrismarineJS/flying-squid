const Vec3 = require('vec3').Vec3
const rand = require('random-seed')

function generation ({ version, seed, level = 50 } = {}) {
  const Chunk = require('prismarine-chunk')(version)
  const mcData = require('minecraft-data')(version)

  function generateChunk (chunkX, chunkZ) {
    const seedRand = rand.create(seed + ':' + chunkX + ':' + chunkZ)
    const chunk = new Chunk()
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const bedrockheighttop = 1 + seedRand(4)
        const bedrockheightbottom = 1 + seedRand(4)
        for (let y = 0; y < 128; y++) { // Nether only goes up to 128
          let block
          let data

          if (y < bedrockheightbottom) block = mcData.blocksByName.bedrock.id
          else if (y < level) block = seedRand(50) === 0 ? mcData.blocksByName.glowstone.id : mcData.blocksByName.netherrack.id
          else if (y > 127 - bedrockheighttop) block = mcData.blocksByName.bedrock.id

          const pos = new Vec3(x, y, z)
          if (block) chunk.setBlockType(pos, block)
          if (data) chunk.setBlockData(pos, data)
          // Don't need to set light data in nether
        }
      }
    }
    return chunk
  }
  return generateChunk
}

module.exports = generation
