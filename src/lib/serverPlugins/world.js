var Chunk = require('prismarine-chunk')(require("../version"));
var World = require('prismarine-world');
var Vec3 = require('vec3');

module.exports = inject;

function inject(serv) {
  function DiamondSquare(size, roughness, seed) {
    // public fields
    this.size = size;
    this.roughness = roughness;
    this.seed = (seed ? seed : Math.random());
    var opCount = 0;

    // private field
    var data = new Array();

    // public methods
    this.value = function(x, y, v) {
      x = parseInt(x);
      y = parseInt(y);
      if (typeof(v) != 'undefined')
        val(x, y, v);
      else
        return val(x, y);
    }
    this.clear = function() {
      data = new Array();
    }
    this.opCount = function(v) {
      if (typeof(v) != 'undefined')
        opCount = v;
      else
        return opCount;
    }

    // private methods
    function val(x, y, v) {
      if (typeof(v) != 'undefined')
        data[x + '_' + y] = Math.max(0.0, Math.min(1.0, v));
      else {
        if (x <= 0 || x >= size || y <= 0 || y >= size) return 0.0;

        if (data[x + '_' + y] == null) {
          opCount++;
          var base = 1;
          while (((x & base) == 0) && ((y & base) == 0))
            base <<= 1;

          if (((x & base) != 0) && ((y & base) != 0))
            squareStep(x, y, base);
          else
            diamondStep(x, y, base);
        }
        return data[x + '_' + y];
      }
    }

    function randFromPair(x, y) {
      for (var i = 0; i < 80; i++) {
        var xm7 = x % 7;
        var xm13 = x % 13;
        var xm1301081 = x % 1301081;
        var ym8461 = y % 8461;
        var ym105467 = y % 105467;
        var ym105943 = y % 105943;
        //y = (i < 40 ? seed : x);
        y = x + seed;
        x += (xm7 + xm13 + xm1301081 + ym8461 + ym105467 + ym105943);
      }

      return (xm7 + xm13 + xm1301081 + ym8461 + ym105467 + ym105943) / 1520972.0;
    }

    function displace(v, blockSize, x, y) {
      return (v + (randFromPair(x, y, seed) - 0.5) * blockSize * 2 / size * roughness);
    }

    function squareStep(x, y, blockSize) {
      if (data[x + '_' + y] == null) {
        val(x, y,
          displace((val(x - blockSize, y - blockSize) +
            val(x + blockSize, y - blockSize) +
            val(x - blockSize, y + blockSize) +
            val(x + blockSize, y + blockSize)) / 4, blockSize, x, y));
      }
    }

    function diamondStep(x, y, blockSize) {
      if (data[x + '_' + y] == null) {
        val(x, y,
          displace((val(x - blockSize, y) +
            val(x + blockSize, y) +
            val(x, y - blockSize) +
            val(x, y + blockSize)) / 4, blockSize, x, y));
      }
    }
  }

  // Selected empirically
  var size = 10000000;
  var space = new DiamondSquare(size, size/1000, Math.random() * 10000);

  function generateSimpleChunk(chunkX, chunkZ) {
    var chunk = new Chunk();

    var worldX = chunkX * 16 + size/2;
    var worldZ = chunkZ * 16 + size/2;

    for (var x = 0; x < 16;x++) {
      for (var z = 0; z < 16; z++) {
        var level = space.value(worldX + x, worldZ + z) * 138;
        for (var y = 0; y < 256; y++) {
          let block;

          if(y == 0) block = 7;
          else if(y < level) block = 3;
          else if (y == level) block = 2;
          else if (y < 20) block = 9;

          if(block) chunk.setBlockType(new Vec3(x, y, z), block);

          chunk.setSkyLight(new Vec3(x, y, z), 15);
        }
      }
    }

    return chunk;
  }

  serv.world = new World(generateSimpleChunk);
}
