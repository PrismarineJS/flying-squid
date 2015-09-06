var Chunk = require('prismarine-chunk')(require("../version"));
var Vec3 = require('vec3');
var gen = require('random-seed');

module.exports = WorldGen;

function WorldGen(genOpt, func, seed) {
    var seed = seed || Math.random()*Math.pow(2, 32);
    return function(world, chunkX, chunkZ, opt) {
        if (!opt) opt = {};
        var chunkSeed = gen(seed + '-' + chunkX + '-' + chunkZ);
        
        for (var o in genOpt) {
            if (typeof opt[o] == 'undefined') opt[o] = genOpt[o]
        }
        
        var chunk = new Chunk();
        func(chunk, opt, chunkSeed, chunkX, chunkZ);
        world.setColumn(chunkX, chunkZ, chunk);
        
        return chunk;
    }
}

/*

USAGE:

var SuperFlat = WorldGen({
    'opt': 'default',
    'bottom_id': 7,
    'middle_id': 1,
    'top_id': 2,
    'middle_thickness': 10
}, function(chunk, opt, [chunkSeed], [chunkX], [chunkZ]) { // The []s are optional
    for (var x = 0; x < 16; x++) {
      for (var z = 0; z < 16; z++) {
        for (var y = 0; y < opt.middle_thickness + 2; y++) {
            if (y == 0) chunk.setBlockType(new Vec3(x, y, z), opt.bottom_id);
            else if (y < opt.middle_thickness + 1) chunk.setBlockType(new Vec3(x, y, z), opt.middle_id);
            else chunk.setBlockType(new Vec3(x, y, z), opt.top_id);
        }
      }
    }
}

*/