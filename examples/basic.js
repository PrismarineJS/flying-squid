var mcServer=require("../");

mcServer.createMCServer({
  motd: "Basic flying-squid server",
  'max-players': 10,
  port: 25565,
  'online-mode': true,
  gameMode:0,
  commands: {},
  logging:false
});
