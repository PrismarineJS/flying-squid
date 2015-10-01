var WorldGen = require('../worldgen');
var Vec3 = require('vec3');

module.exports = WorldGen({
      'opt': 'default',
      'bottom_id': 7,
      'middle_id': 1,
      'top_id': 2,
      'middle_thickness': 3,
      'debug': false
  }, function(chunk, opt, chunkSeed, chunkX, chunkZ) {
      var height = opt.middle_thickness + 1;
      var DEBUG_POINTS = [new Vec3(0, height, 0), new Vec3(15, height, 0), new Vec3(0, height, 15), new Vec3(15, height, 15)];
      for (var x = 0; x < 16; x++) {
        for (var z = 0; z < 16; z++) {
          for (var y = 0; y < opt.middle_thickness + 2; y++) {
            if (y == 0) chunk.setBlockType(new Vec3(x, y, z), opt.bottom_id);
            else if (y < opt.middle_thickness + 1) chunk.setBlockType(new Vec3(x, y, z), opt.middle_id);
            else chunk.setBlockType(new Vec3(x, y, z), opt.top_id); 
          }
        }
      }
      
      if (opt.debug) {
          for (var d in DEBUG_POINTS) {
              chunk.setBlockType(DEBUG_POINTS[d], 35);
          }
      }
  });