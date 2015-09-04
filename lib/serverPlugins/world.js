var World = require('prismarine-chunk');
var cancelEmit = require('../cancelEvents');

module.exports=inject;

function inject(serv) {

  serv.world=new World();
  
  var doDefault = cancelEmit(serv, 'gen_world', {});
  if (!doDefault) return;

  for (var x = 0; x < 16;x++) {
    for (var z = 0; z < 16; z++) {
      serv.world.setBlockType(x, 50, z, 2);
      for (var y = 0; y < 256; y++) {
        serv.world.setSkyLight(x, y, z, 15);
      }
    }
  }
}