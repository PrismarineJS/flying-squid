#!/usr/bin/env node

var mcServer=require("./");

var settings = require('./config/settings');
var commands = require('./config/commands');

var options = {
  'motd': settings.motd,
  'max-players': settings.maxPlayers,
  'port': settings.port,
  'online-mode': settings.onlineMode,
  'gameMode': settings.gameMode,
  'commands': commands,
  'logging': settings.logging,
  'modpe': settings.modpe
};

mcServer.createMCServer(options);


