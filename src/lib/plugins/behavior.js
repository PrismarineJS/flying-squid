var Behavior = require('../behavior');

module.exports.server = function(serv) {
  serv.behavior = new Behavior(serv);
}

module.exports.entity = function(entity, serv) {
  entity.behavior = new Behavior(entity);
}