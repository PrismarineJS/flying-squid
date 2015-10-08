var Chunk = require('prismarine-chunk')(require("../version"));
var World = require('prismarine-world');
var Vec3 = require('vec3');

module.exports=inject;

function inject(serv) {

  function generateSimpleChunk(chunkX, chunkZ) {
    var chunk=new Chunk();

    for (var x = 0; x < 16;x++) {
      for (var z = 0; z < 16; z++) {
        chunk.setBlockType(new Vec3(x, 50, z), 2);
        for (var y = 0; y < 256; y++) {
          chunk.setSkyLight(new Vec3(x, y, z), 15);
        }
      }
    }

    return chunk;
  }

  serv.world=new World(generateSimpleChunk);
}