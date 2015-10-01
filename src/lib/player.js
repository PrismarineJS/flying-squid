var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = Player;

function Player()
{
  EventEmitter.call(this);
  this._client=null;
  this._entity=null;
}
util.inherits(Player, EventEmitter);