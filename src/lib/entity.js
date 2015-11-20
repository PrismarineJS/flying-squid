var EventEmitter = require('events').EventEmitter;
var PrismarineEntity = require("prismarine-entity");
var util = require('util');
util.inherits(PrismarineEntity, EventEmitter);

class Entity extends PrismarineEntity
{
  constructor(id) {
    super(id);
    EventEmitter.call(this);
  }
}

module.exports = Entity;