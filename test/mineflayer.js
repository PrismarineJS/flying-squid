var net = require('net');
var mcServer=require("../");
var settings = require('../config/default-settings');
var mineflayer = require("mineflayer");


describe("Server with mineflayer connection", function() {
  var bot;
  var serv;
  var player;
  before(function(done){
    var options = {
      'motd': settings.motd,
      'max-players': settings.maxPlayers,
      'port': 25566,
      'online-mode': false,
      gameMode:settings.gameMode,
      logging:settings.logging,
      generation:settings.generation,
      'modpe': settings.modpe,
      kickTimeout: settings.kickTimeout ? settings.kickTimeout : 10*1000,
      regionFolder: settings.regionFolder,
      plugins: settings.plugins
    };

    serv=mcServer.createMCServer(options);

    serv.on("listening",function(){
      bot = mineflayer.createBot({
        host: "localhost",
        port: 25566,
        username: "echo"
      });

      serv.once("newPlayer",function(p){
        player=p;
      });

      bot.on('spawn', function() {
        done();
      });
    })
  });

  describe("commands",function(){
    it("has an help command", function(done) {
      bot.once("message",function(message){
        done();
      });
      bot.chat("/help");
    });
    it("can use /particle",function(done){
      bot._client.on('world_particles',function(){
        done();
      });
      bot.chat("/particle 5 10 100 100 100");
    });
    it("can use /playsound",function(done) {
      bot.on('soundEffectHeard',function(){
        done();
      });
      bot.chat('/playsound ambient.weather.rain');
    });
    it("can use /summon",function(done) {
      bot.on('entitySpawn',function(entity){
        if(entity.name=="EnderDragon")
          done();
      });
      bot.chat('/summon EnderDragon');
    });
  });
});
