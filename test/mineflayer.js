var net = require('net');
var mcServer=require("../");
var settings = require('../config/default-settings');
var mineflayer = require("mineflayer");
var assert = require('chai').assert;
var Vec3 = require('vec3').Vec3;

function assertPosEqual(pos1,pos2) {
  assert.isBelow(pos1.distanceTo(pos2),0.01);
}


describe("Server with mineflayer connection", function() {
  var bot;
  var bot2;
  var serv;
  before(function(done){
    var options = settings;
    options["online-mode"]=false;
    options["port"]=25566;

    serv=mcServer.createMCServer(options);

    serv.on("listening",function(){
      bot = mineflayer.createBot({
        host: "localhost",
        port: 25566,
        username: "bot"
      });
      bot2 = mineflayer.createBot({
        host: "localhost",
        port: 25566,
        username: "bot2"
      });

      var nbSpawn=0;

      function spawn() {
        nbSpawn++;
        if(nbSpawn==2)
          done();
      }

      bot.on('spawn', spawn);
      bot2.on('spawn', spawn);

    })
  });

  after(function(done){
    serv._server.close();
    serv._server.on("close",function(){
      done();
    });
  });

  describe("commands",function(){
    it("has an help command", function(done) {
      bot.once("message",function(){
        done();
      });
      bot.chat("/help");
    });
    it("can use /particle",function(done){
      bot._client.once('world_particles',function(){
        done();
      });
      bot.chat("/particle 5 10 100 100 100");
    });
    it("can use /playsound",function(done) {
      bot.once('soundEffectHeard',function(){
        done();
      });
      bot.chat('/playsound ambient.weather.rain');
    });
    it("can use /summon",function(done) {
      var listener=function(entity){
        if(entity.name=="EnderDragon") {
          bot.removeListener('entitySpawn',listener);
          done();
        }
      };
      bot.on('entitySpawn',listener);
      bot.chat('/summon EnderDragon');
    });
    describe("can use /tp",function() {
      it("can tp myself",function(done) {
          bot.once('forcedMove', function () {
            assertPosEqual(bot.entity.position,new Vec3(2, 3, 4));
            done();
          });
          bot.chat('/tp 2 3 4');
        });
      it("can tp somebody else",function(done) {
        bot2.once('forcedMove', function () {
          assertPosEqual(bot2.entity.position,new Vec3(2, 3, 4));
          done();
        });
        bot.chat('/tp bot2 2 3 4');
      });
      it("can tp to somebody else",function(done) {
        bot2.once('forcedMove', function () {
          assertPosEqual(bot2.entity.position,bot.entity.position);
          done();
        });
        bot.chat('/tp bot2 bot');
      });
    });
  });
});
