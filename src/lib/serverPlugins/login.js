var path = require('path');
var requireIndex = require('requireindex');
var playerPlugins = requireIndex(path.join(__dirname,'..', 'playerPlugins'));
var Player=require("../player");

module.exports = inject;

function inject(serv,options)
{
  serv._server.on('connection', client =>
    client.on('error',error => serv.emit('clientError',client,error)));

  serv._server.on('login', async (client) => {
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