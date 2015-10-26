var mc = require('minecraft-protocol');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var requireIndex = require('requireindex');
var serverPlugins = requireIndex(path.join(__dirname, 'lib', 'serverPlugins'));
if (process.env.NODE_ENV === 'dev'){
  require('longjohn');
}

module.exports = {
  createMCServer:createMCServer
};

function createMCServer(options) {
  options = options || {};
  var mcServer = new MCServer();
  mcServer.connect(options);
  return mcServer;
}

class MCServer extends EventEmitter {
  constructor() {
    super();
    this._server = null;
  }

  connect(options) {
    this._server = mc.createServer(options);
    Object.keys(serverPlugins).forEach(pluginName => serverPlugins[pluginName](this, options));
    if(options.logging == true) this.createLog();
    this._server.on('error', error => this.emit('error',error));
    this._server.on('listening', () => this.emit('listening',this._server.socketServer.address().port));
  }
}