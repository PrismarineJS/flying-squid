var Chunk = require('prismarine-chunk')(require("../version"));
var Vec3 = require('vec3').Vec3;

function generation() {
  function generateSimpleChunk() {
    var chunk = new Chunk();

    for (var x = 0; x < 16; x++) {
      for (var z = 0; z < 16; z++) {
        chunk.setBlockType(new Vec3(x, 50, z), 2);
        for (var y = 0; y < 256; y++) {
          chunk.setSkyLight(new Vec3(x, y, z), 15);
        }
      }
    }

    return chunk;
  }
  return generateSimpleChunk;
}

module.exports=generation;