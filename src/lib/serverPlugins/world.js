var Chunk = require('prismarine-chunk')(require("../version"));
var World = require('prismarine-world');
var Vec3 = require('vec3');
var WorldSync = require("prismarine-world-sync");

var generations={
  'grass_field':require("../worldGenerations/grass_field"),
  'diamond_square':require("../worldGenerations/diamond_square"),
  'superflat':require("../worldGenerations/superflat"),
  'all_the_blocks':require("../worldGenerations/all_the_blocks"),
  'nether':require("../worldGenerations/nether")
};

module.exports = inject;

function inject(serv,{regionFolder,generation={"name":"diamond_square","options":{"worldHeight":80}}}={}) {
  generation.options.seed=generation.options.seed || Math.random()*Math.pow(2, 32);
  serv.emit("seed",generation.options.seed);
  serv.overworld = new World(generations[generation.name](generation.options), regionFolder);
  serv.netherworld = new World(generations["nether"]({}));
  //serv.endworld = new World(generations["end"]({}));

  serv._worldSync=new WorldSync(serv.overworld);

  serv.pregenWorld = (world, size=10) => {
    var promises = [];
    for (var x = -size; x < size; x++) {
      for (var z = -size; z < size; z++) {
        promises.push(world.getColumn(x, z));
      }
    }
    return Promise.all(promises);
  };

  //serv.pregenWorld(serv.overworld).then(() => serv.log('Pre-Generated Overworld'));
  //serv.pregenWorld(serv.netherworld).then(() => serv.log('Pre-Generated Nether'));
}