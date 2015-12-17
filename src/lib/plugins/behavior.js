const Behavior = require("flying-squid").Behavior;

module.exports.server = function(serv) {
  serv.behavior = new Behavior(serv);
};

module.exports.entity = function (entity) {
  entity.behavior = new Behavior(entity);
};