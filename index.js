var mc = require('minecraft-protocol');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
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

function MCServer() {
  EventEmitter.call(this);
  this._server = null;
}
util.inherits(MCServer, EventEmitter);

MCServer.prototype.connect = function(options) {
  var self = this;
  self._server = mc.createServer(options);

  for(var pluginName in serverPlugins) {
    serverPlugins[pluginName](self, options);
  }

  if(options.logging == true) {
    self.createLog();
  }

  self._server.on('error', function(error) {
    self.emit('error',error);
  });

  self._server.on('listening', function() {
    self.emit('listening',self._server.socketServer.address().port);
  });
};
