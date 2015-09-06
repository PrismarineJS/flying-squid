var Chunk = require('prismarine-chunk')(require("../version"));
var World = require('prismarine-world');
var WorldGen = require('../worldgen');
var Vec3 = require('vec3');

module.exports=inject;

function inject(serv) {

  serv.world=new World();
  
  var SuperFlat = WorldGen({
      'opt': 'default',
      'bottom_id': 7,
      'middle_id': 1,
      'top_id': 2,
      'middle_thickness': 3
  }, function(chunk, opt, chunkSeed, chunkX, chunkZ) {
      for (var x = 0; x < 16; x++) {
        for (var z = 0; z < 16; z++) {
          for (var y = 0; y < opt.middle_thickness + 2; y++) {
            if (y == 0) chunk.setBlockType(new Vec3(x, y, z), opt.bottom_id);
            else if (y < opt.middle_thickness + 1) chunk.setBlockType(new Vec3(x, y, z), opt.middle_id);
            else chunk.setBlockType(new Vec3(x, y, z), opt.top_id);
          }
        }
      }
  });

  for(var chunkX=-1;chunkX<2;chunkX++)
  {
    for(var chunkZ=-1;chunkZ<2;chunkZ++)
    {
      var chunk = SuperFlat(serv.world, chunkX, chunkZ, {});
      for (var x = 0; x < 16;x++) {
        for (var z = 0; z < 16; z++) {
          for (var y = 0; y < 256; y++) {
            chunk.setSkyLight(new Vec3(x, y, z), 15);
          }
        }
      }
    }
  }
}