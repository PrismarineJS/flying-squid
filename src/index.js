var mc = require('minecraft-protocol');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var requireIndex = require('requireindex');
require('emit-then').register();
if (process.env.NODE_ENV === 'dev'){
  require('longjohn');
}

module.exports = {
  createMCServer:createMCServer,
  Behavior:require("./lib/behavior"),
  Command:require("./lib/command"),
  version:require("./lib/version"),
  generations:require("./lib/generations"),
  experience:require("./lib/experience"),
  UserError:require("./lib/user_error")
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
    var plugins = requireIndex(path.join(__dirname, 'lib', 'plugins'));
    this._server = mc.createServer(options);
    Object.keys(plugins)
      .filter(pluginName => plugins[pluginName].server!=undefined)
      .forEach(pluginName => plugins[pluginName].server(this, options));
    if(options.logging == true) this.createLog();
    this._server.on('error', error => this.emit('error',error));
    this._server.on('listening', () => this.emit('listening',this._server.socketServer.address().port));
    this.emit('asap');

    process.on('unhandledRejection', err => this.emit('error',err));
  }
}