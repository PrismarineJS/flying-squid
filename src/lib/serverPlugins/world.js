var Chunk = require('prismarine-chunk')(require("../version"));
var World = require('prismarine-world');
var Vec3 = require('vec3');
var WorldSync = require("prismarine-world-sync");

var generations={
  'grass_field':require("../worldGenerations/grass_field"),
  'diamond_square':require("../worldGenerations/diamond_square"),
  'superflat':require("../worldGenerations/superflat"),
  'all_the_blocks':require("../worldGenerations/all_the_blocks")
};

module.exports = inject;

function inject(serv,{regionFolder,generation={"name":"diamond_square","options":{"worldHeight":80}}}={}) {
  generation.options.seed=generation.options.seed || Math.random()*Math.pow(2, 32);
  serv.emit("seed",generation.options.seed);
  serv.world = new World(generations[generation.name](generation.options),regionFolder);
  serv._worldSync=new WorldSync(serv.world);
}
