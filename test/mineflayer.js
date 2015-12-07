var net = require('net');
var mcServer=require("../");
var settings = require('../config/default-settings');
var mineflayer = require("mineflayer");
var assert = require('chai').assert;
var Vec3 = require('vec3').Vec3;

function assertPosEqual(pos1,pos2) {
  assert.isBelow(pos1.distanceTo(pos2),0.1);
}
var once = require('event-promise');

describe("Server with mineflayer connection", () =>  {
  var bot;
  var bot2;
  var serv;
  before(async function () {
    this.timeout(10 * 60 * 1000);
    var options = settings;
    options["online-mode"]=false;
    options["port"]=25566;

    serv=mcServer.createMCServer(options);

    await once(serv,"listening");
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

    await new Promise((cb) => {
      var l=() => {
        if(bot.entity.onGround) {
          bot.removeListener("move",l);
          cb();
        }
      };
      bot.on("move",l);
    });
  });

  after(() => {
    serv._server.close();
    return once(serv._server,"close");
  });

  describe("commands",() => {
    it("has an help command", async () => {
      bot.chat("/help");
      await once(bot,"message");
    });
    it("can use /particle",async () => {
      bot.chat("/particle 5 10 100 100 100");
      await once(bot._client,'world_particles');
    });
    it("can use /playsound",async () => {
      bot.chat('/playsound ambient.weather.rain');
      await once(bot,'soundEffectHeard');
    });
    it("can use /summon",async () => {
      bot.chat('/summon EnderDragon');
      await new Promise((done) => {
        var listener=(entity) => {
          if(entity.name=="EnderDragon") {
            bot.removeListener('entitySpawn',listener);
            done();
          }
        };
        bot.on('entitySpawn',listener);
      });
    });
    describe("can use /tp",() => {
      it("can tp myself", async () => {
        bot.chat('/tp 2 3 4');
        await once(bot,'forcedMove');
        assertPosEqual(bot.entity.position, new Vec3(2, 3, 4));
      });
      it("can tp somebody else",async () => {
        bot.chat('/tp bot2 2 3 4');
        await once(bot2,'forcedMove');
        assertPosEqual(bot2.entity.position, new Vec3(2, 3, 4));
      });
      it("can tp to somebody else",async () => {
        bot.chat('/tp bot2 bot');
        await once(bot2,'forcedMove');
        assertPosEqual(bot2.entity.position, bot.entity.position);
      });
      it("can tp with relative positions",async () => {
        var initialPosition=bot.entity.position.clone();
        bot.chat('/tp ~1 ~-2 ~3');
        await once(bot,'forcedMove');
        assertPosEqual(bot.entity.position,initialPosition.offset(1,-2,3));
      });
      it("can tp somebody else with relative positions",async () => {
        var initialPosition=bot2.entity.position.clone();
        bot.chat('/tp bot2 ~1 ~-2 ~3');
        await once(bot2,'forcedMove');
        assertPosEqual(bot2.entity.position,initialPosition.offset(1,-2,3));
      });
    });
    it("can use /deop",async () => {
      bot.chat('/deop bot');
      let msg1=await once(bot,'message');
      assert.equal(msg1.text,'bot is deopped');
      bot.chat('/op bot');
      let msg2=await once(bot,'message');
      assert.equal(msg2.text,'You do not have permission to use this command');
      serv.getPlayer("bot").op=true;
    });
    it("can use /setblock",async() => {
      bot.chat('/setblock 1 2 3 95 0');
      let [oldBlock,newBlock]=await once(bot,'blockUpdate:'+new Vec3(1,2,3),{array:true});
      assert.equal(newBlock.type,95);
    });
    it("can use /xp",async() => {
      bot.chat('/xp 100');
      await once(bot,"experience");
      assert.equal(bot.experience.points,100);
    });
  });
});
