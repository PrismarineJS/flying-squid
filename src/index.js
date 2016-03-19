const mc = require('minecraft-protocol');
const EventEmitter = require('events').EventEmitter;
const path = require('path');
const requireIndex = require('requireindex');
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
  UserError:require("./lib/user_error"),
  portal_detector:require('./lib/portal_detector')
};

function createMCServer(options) {
  options = options || {};
  const mcServer = new MCServer();
  mcServer.connect(options);
  return mcServer;
}

class MCServer extends EventEmitter {
  constructor() {
    super();
    this._server = null;
  }

  connect(options) {
    const plugins = requireIndex(path.join(__dirname, 'lib', 'plugins'));
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