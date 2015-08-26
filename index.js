var mc = require('minecraft-protocol');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var requireIndex = require('requireindex');
var serverPlugins = requireIndex(path.join(__dirname, 'lib', 'serverPlugins'));
var clientPlugins = requireIndex(path.join(__dirname, 'lib', 'clientPlugins'));

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
    console.log('[ERR] ', error.stack);
    self.log('[ERR]: Server:', error.stack);
  });

  self._server.on('listening', function() {
    console.log('[INFO]: Server listening on port', self._server.socketServer.address().port);
    self.log('[INFO]: Server listening on port', self._server.socketServer.address().port);
  });

  self._server.on('login', function (client) {
    for(var pluginName in clientPlugins) {
      clientPlugins[pluginName](self, client, options);
    }
    self.login(client);
  });
};
