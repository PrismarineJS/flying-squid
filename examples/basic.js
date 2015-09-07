var mcServer=require("..");
var modpeWrap = require('modpe-squid')(mcServer);

var serv = mcServer.createMCServer({
  motd: "Basic flying-squid server",
  'max-players': 10,
  port: 25565,
  'online-mode': true,
  gameMode:0,
  commands: {},
  logging:false
});

modpeWrap(serv);
