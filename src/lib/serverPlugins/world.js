var Chunk = require('prismarine-chunk')(require("../version"));
var World = require('prismarine-world');
var Vec3 = require('vec3');

var generations={
  'grass_field':require("../worldGenerations/grass_field"),
  'diamond_square':require("../worldGenerations/diamond_square")
};

module.exports = inject;

function inject(serv,options) {
  serv.world = new World(generations[options["generation"]]);
}
