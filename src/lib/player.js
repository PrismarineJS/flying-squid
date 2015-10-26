var EventEmitter = require('events').EventEmitter;


class Player extends EventEmitter
{
  constructor() {
    super();
    this._client=null;
    this.entity=null;
  }
}

module.exports = Player;