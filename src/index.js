var mc = require('minecraft-protocol');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var requireIndex = require('requireindex');
var plugins = requireIndex(path.join(__dirname, 'lib', 'plugins'));
require('emit-then').register();
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
    Object.keys(plugins)
      .filter(pluginName => plugins[pluginName].server!=undefined)
      .forEach(pluginName => plugins[pluginName].server(this, options));
    if(options.logging == true) this.createLog();
    this._server.on('error', error => this.emit('error',error));
    this._server.on('listening', () => this.emit('listening',this._server.socketServer.address().port));
    this.emit('asap');
  }
}