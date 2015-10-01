var Chunk = require('prismarine-chunk')(require("../version"));
var World = require('prismarine-world');
var Vec3 = require('vec3');

module.exports=inject;

function inject(serv) {
  
  var generation = require('../generations/superflat')();
  
  serv.world = generation.generateWorld({ // Generate world options
    sizeX: 5,
    sizeZ: 5,
    setLight: true
  }, { // Chunk generation options
    debug: true
  });
}