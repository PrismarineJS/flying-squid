var mcServer=require("./index");

var settings = require('./config/settings');

var options = {
  motd: settings.motd,
  'max-players': settings.maxPlayers,
  port: settings.port,
  'online-mode': settings.onlineMode
};

mcServer.createMCServer(options);


