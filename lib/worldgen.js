var Chunk = require('prismarine-chunk')(require("./version"));
var World = require('prismarine-world');
var Vec3 = require('vec3');
var gen = require('random-seed');

module.exports = WorldGen;

function WorldGen(genOpt, func) {
    
    return function(chunkOpt, seed) {
        var seed = seed || Math.random()*Math.pow(2, 32);
        
        var generate = function(chunkX, chunkZ, opt) {
            if (!opt) opt = chunkOpt || {};
            var chunkSeed = gen(seed + '-' + chunkX + '-' + chunkZ);
        
            for (var o in genOpt) {
                if (typeof opt[o] == 'undefined') opt[o] = genOpt[o]
            }
        
            var chunk = new Chunk();
            func(chunk, opt, chunkSeed, chunkX, chunkZ);
        
            return chunk;
        }
    
        var generateWorld = function(opt, worldChunkOpt) {
            var world = new World();
            
            var sizeX = opt.sizeX || 11;
            var sizeZ = opt.sizeZ || 11;
            for (var cX = Math.ceil(-sizeX/2); cX < Math.ceil(sizeX/2); cX++) {
                for (var cZ = Math.ceil(-sizeZ/2); cZ < Math.ceil(sizeZ/2); cZ++) {
                    var chunk = generate(cX, cZ, worldChunkOpt || chunkOpt)
                    world.setColumn(cX, cZ, chunk);
                    
                    if (opt.setLight) {
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
            return world;
        }
        
        return {
            generate: generate,
            generateWorld: generateWorld
        }
    }
}