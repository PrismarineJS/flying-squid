var path = require('path');
var requireIndex = require('requireindex');
var playerPlugins = requireIndex(path.join(__dirname,'..', 'playerPlugins'));
var Player=require("../player");
var UUID = require('uuid-1345');

module.exports = inject;

function inject(serv,options)
{
  serv._server.on('login', async (client) => {
    if(!options["online-mode"])
      client.uuid=UUID.v3({
        namespace: UUID.namespace.dns,
        name: client.username
      });
    client.write('set_compression', { threshold: 256 }); // Default threshold is 256
    client.compressionThreshold = 256;
    var player=new Player();
    player._client=client;
    Object.keys(playerPlugins)
      .forEach(pluginName => playerPlugins[pluginName](serv, player, options));

    serv.emit("newPlayer",player);
    try {
      await player.login();
    }
    catch(err){
      setTimeout(() => {throw err;},0)
    }
  });
}