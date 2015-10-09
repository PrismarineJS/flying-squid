#!/usr/bin/env node

var mcServer=require("./");

var settings;

try {
  settings = require('./config/settings');
}
catch(err) {
  settings = require('./config/default-settings');
}

var commands = require('./config/commands');

var options = {
  'motd': settings.motd,
  'max-players': settings.maxPlayers,
  'port': settings.port,
  'online-mode': settings.onlineMode,
  gameMode:settings.gameMode,
  commands: commands,
  logging:settings.logging,
  kickTimeout:10*60*1000,
  generation:settings.generation,
  'modpe': settings.modpe
};

mcServer.createMCServer(options);


