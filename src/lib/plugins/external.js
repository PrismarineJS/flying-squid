module.exports.server = function(serv, settings) {
  serv.plugins = {};
  serv.pluginCount = 0;
  serv.externalPluginsLoaded = false;

  serv.addPlugin = (name, plugin, set) => {
    if (!name || !plugin) throw new Error('You need a name and object for your plugin!');
    serv.plugins[name] = {
      id: serv.pluginCount,
      name: name,
      player: plugin.player,
      entity: plugin.entity,
      server: plugin.server,
      settings: set,
      enabled: true
    };
    serv.pluginCount++;
    if (serv.externalPluginsLoaded && plugin.server) serv.plugins[name].server.call(p, serv, settings);
  }

  for (var p in settings.plugins) {
    try {
      serv.addPlugin(p, require(p), settings.plugins[p]);
    } catch (err) {
      try {
        serv.addPlugin(p, require('../../plugins/' + p), settings.plugins[p]);
      } catch (err) {
        throw new Error('Cannot find plugin "' + p + '"');
      }
    }
  }

  for (var p in serv.plugins) {
    if (serv.plugins[p].server) serv.plugins[p].server.call(serv.plugins[p], serv, settings);
  }
  serv.externalPluginsLoaded = true;
};

module.exports.player = function(player, serv) {
  Object.keys(serv.plugins).forEach(p => {
    var plugin = serv.plugins[p];
    if (plugin.player) plugin.player.call(plugin, player, serv);
  });
};

module.exports.entity = function(entity, serv) {
  entity.pluginData = {};

  Object.keys(serv.plugins).forEach(p => {
    entity.pluginData[p] = {};
  });

  entity.getData = (pluginName) => {
    if (typeof pluginName == 'object') pluginName = pluginName.name;
    return entity.pluginData[pluginName] || null;
  }

  Object.keys(serv.plugins).forEach(p => {
    var plugin = serv.plugins[p];
    if (plugin.entity) plugin.entity.call(plugin, entity, serv);
  });
}