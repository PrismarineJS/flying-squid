#!/usr/bin/env node

var mcServer=require("./");

var settings;

try {
  settings = require('./config/settings');
}
catch(err) {
  settings = require('./config/default-settings');
}

var options = {
  'motd': settings.motd,
  'max-players': settings.maxPlayers,
  'port': settings.port,
  'online-mode': settings.onlineMode,
  gameMode:settings.gameMode,
  logging:settings.logging,
  generation:settings.generation,
  'modpe': settings.modpe,
  kickTimeout: settings.kickTimeout ? settings.kickTimeout : 10*1000,
  regionFolder: settings.regionFolder,
  plugins: settings.plugins
};

module.exports=mcServer.createMCServer(options);


