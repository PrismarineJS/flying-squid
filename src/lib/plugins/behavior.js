const Behavior = require('../behavior')

module.exports.server = function (serv) {
  serv.behavior = Behavior(serv)
}

module.exports.entity = function (entity) {
  entity.behavior = Behavior(entity)
}
