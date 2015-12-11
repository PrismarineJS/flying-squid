var net = require('net');
var mcServer=require("flying-squid");
var settings = require('../config/default-settings');
var mineflayer = require("mineflayer");
var assert = require('chai').assert;
var Vec3 = require('vec3').Vec3;

function assertPosEqual(actual,expected) {
  assert.isBelow(actual.distanceTo(expected),0.1,"expected: "+expected+", actual: "+actual+"\n");
}
var once = require('event-promise');

describe("Server with mineflayer connection", function()  {
  this.timeout(10 * 60 * 1000);
  var bot;
  var bot2;
  var serv;

  async function onGround(bot)
  {
    await new Promise((cb) => {
      var l=() => {
        if(bot.entity.onGround) {
          bot.removeListener("move",l);
          cb();
        }
      };
      bot.on("move",l);
    });
  }

  async function waitMessage(bot,message) {
    let msg1=await once(bot,'message');
    assert.equal(msg1.text,message);
  }

  async function waitMessages(bot,messages) {
    var toReceive=messages.reduce((acc,message) => {
      acc[message]=1;
      return acc;
    },{});
    var received={};
    return new Promise(cb => {
      var listener=msg => {
          var message=msg.text;
          if(!toReceive[message]) throw new Error("Received "+message+" , expected to receive one of "+messages);
          if(received[message]) throw new Error("Received "+message+" two times");
          received[message]=1;
          if(Object.keys(received).length==messages.length)
          {
            bot.removeListener('message',listener);
            cb();
          }
        };
      bot.on('message',listener);
    });
  }

  async function waitLoginMessage(bot) {
    return Promise.all([waitMessages(bot,['bot joined the game.','bot2 joined the game.'])]);
  }

  beforeEach(async function () {
    this.timeout(10 * 60 * 1000);
    var options = settings;
    options["online-mode"]=false;
    options["port"]=25566;
    options["view-distance"]=1;

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

    await Promise.all([once(bot,'login'),once(bot2,'login')]);
  });

  afterEach(async () => {
    await serv.quit();
  });



  describe("actions",() => {

    it("can dig",async function () {
      await onGround(bot);
      this.timeout(10 * 60 * 1000);
      var pos=bot.entity.position.offset(0,-1,0);
      bot.dig(bot.blockAt(pos));
      let [oldBlock,newBlock]=await once(bot,'blockUpdate:'+pos,{array:true});
      assert.equal(newBlock.type,0);
    });
    it.skip("can place a block",async function () {
      await onGround(bot);

      this.timeout(10 * 60 * 1000);
      var pos=bot.entity.position.offset(0,-2,0);
      bot.dig(bot.blockAt(pos));

      let [oldBlock,newBlock]=await once(bot2,'blockUpdate:'+pos,{array:true});
      assert.equal(newBlock.type,0);
      bot.creative.setInventorySlot(36,new mineflayer.Item(1,1));
      await new Promise((cb) => {
        bot.inventory.on("windowUpdate",(slot,oldItem,newItem) => {
          if(slot==36 && newItem && newItem.type==1)
            cb();
        });
      });

      bot.placeBlock(bot.blockAt(pos.offset(0,-2,0)),new Vec3(0,1,0));
      [oldBlock,newBlock]=await once(bot2,'blockUpdate:'+pos.offset(0,-1,0),{array:true});
      assert.equal(newBlock.type,1);
    });
  });

  describe("commands",() => {

    it("has an help command", async () => {
      await waitLoginMessage(bot);
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

    function waitDragon()
    {
      return new Promise((done) => {
        var listener=(entity) => {
          if(entity.name=="EnderDragon") {
            bot.removeListener('entitySpawn',listener);
            done();
          }
        };
        bot.on('entitySpawn',listener);
      });
    }

    it("can use /summon",async () => {
      bot.chat('/summon EnderDragon');
      await waitDragon();
    });
    it("can use /kill",async () => {
      bot.chat('/summon EnderDragon');
      await waitDragon();
      bot.chat('/kill @e[type=EnderDragon]');
      const entity=await once(bot,'entityDead');
      assert.equal(entity.name,"EnderDragon");
    });
    describe("can use /tp",() => {
      beforeEach(() => Promise.all([onGround(bot),onGround(bot2)]));
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
      await waitLoginMessage(bot);
      bot.chat('/deop bot');
      await waitMessage(bot,'bot is deopped');
      bot.chat('/op bot');
      await waitMessage(bot,'You do not have permission to use this command');
      serv.getPlayer("bot").op=true;
    });
    it("can use /setblock",async() => {
      await once(bot,'chunkColumnLoad');
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
