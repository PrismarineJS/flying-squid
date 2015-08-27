var path = require('path');
var requireIndex = require('requireindex');
var playerPlugins = requireIndex(path.join(__dirname,'..', 'playerPlugins'));
var Player=require("../player");

module.exports = inject;

function inject(serv,options)
{
  serv._server.on('login', function (client) {
    var player=new Player();
    player._client=client;
    for(var pluginName in playerPlugins) {
      playerPlugins[pluginName](serv, player, options);
    }
    serv.emit("newPlayer",player);
    player.login();
  });
}