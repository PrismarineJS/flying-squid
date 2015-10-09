var path = require('path');
var requireIndex = require('requireindex');
var playerPlugins = requireIndex(path.join(__dirname,'..', 'playerPlugins'));
var Player=require("../player");
var UUID = require('uuid-1345');

module.exports = inject;

function inject(serv,options)
{
  serv._server.on('login', function (client) {
    if(!options["online-mode"])
      client.uuid=UUID.v3({
        namespace: UUID.namespace.dns,
        name: client.username
      });
    var player=new Player();
    player._client=client;
    for(var pluginName in playerPlugins) {
      playerPlugins[pluginName](serv, player, options);
    }
    serv.emit("newPlayer",player);
    player.login();
  });
}