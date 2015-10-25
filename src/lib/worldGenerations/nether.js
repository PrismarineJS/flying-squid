var Chunk = require('prismarine-chunk')(require("../version"));
var Vec3 = require('vec3');
var rand = require('random-seed');

function generation({seed,level=50}={}) {
  function generateChunk(chunkX, chunkZ) {
    var seedRand = rand.create(seed+':'+chunkX+':'+chunkZ);
    var chunk=new Chunk();
    for (var x = 0; x < 16; x++) {
      for (var z = 0; z < 16; z++) {
        var bedrockheighttop = 1 + seedRand(4);
        var bedrockheightbottom = 1 + seedRand(4);
        for (var y = 0; y < 128; y++) { // Nether only goes up to 128
          let block;
          let data;

          if (y < bedrockheightbottom) block = 7;
          else if (y < 50) block = 87;
          else if (y > 127 - bedrockheighttop) block = 7;

          var pos = new Vec3(x, y, z);
          if (block) chunk.setBlockType(pos, block);
          if (data) chunk.setBlockData(pos, data);
          // Don't need to set light data in nether
        }
      }
    }
    return chunk;
  }
  return generateChunk;
}

module.exports = generation;