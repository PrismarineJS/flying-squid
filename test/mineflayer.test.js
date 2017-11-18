const net = require("net");
const mcServer = require("../");
const settings = require("../config/default-settings");
const mineflayer = require("mineflayer");
const Vec3 = require("vec3").Vec3;

function assertPosEqual(actual, expected) {
  expect(actual.distanceTo(expected)).toBeLessThan(1);
}
const once = require("event-promise");

describe("Server with mineflayer connection", () => {
  this.timeout(10 * 60 * 1000);
  let bot;
  let bot2;
  let serv;

  async function onGround(bot)
  {
    await new Promise((cb) => {
      const l = () => {
        if(bot.entity.onGround) {
          bot.removeListener("move", l);
          cb();
        }
      };
      bot.on("move", l);
    });
  }

  async function waitMessage(bot, message) {
    const msg1 = await once(bot, "message");
    expect(msg1.extra[0].text).toEqual(message);
  }

  async function waitMessages(bot, messages) {
    const toReceive = messages.reduce((acc, message) => {
      acc[message] = 1;
      return acc;
    }, {});
    const received = {};
    return new Promise(cb => {
      const listener = msg => {
        const message = msg.extra[0].text;
        if(!toReceive[message]) throw new Error("Received " + message + " , expected to receive one of " + messages);
        if(received[message]) throw new Error("Received " + message + " two times");
        received[message] = 1;
        if(Object.keys(received).length == messages.length)
        {
          bot.removeListener("message", listener);
          cb();
        }
      };
      bot.on("message", listener);
    });
  }

  async function waitLoginMessage(bot) {
    return Promise.all([waitMessages(bot, ["bot joined the game.", "bot2 joined the game."])]);
  }

  beforeEach(async () => {
    this.timeout(10 * 60 * 1000);
    const options = settings;
    options["online-mode"] = false;
    options["port"] = 25566;
    options["view-distance"] = 2;
    options["worldFolder"] = undefined;

    serv = mcServer.createMCServer(options);

    await once(serv, "listening");
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

    await Promise.all([once(bot, "login"), once(bot2, "login")]);
    bot.entity.onGround = false;
    bot2.entity.onGround = false;
  });

  afterEach(async () => {
    await serv.quit();
  });

  describe("actions", () => {

    function waitSpawnZone(bot, view)
    {
      const nbChunksExpected = (view * 2) * (view * 2);
      let c = 0;
      return new Promise(cb => {
        const listener = () => {
          c++;
          if(c == nbChunksExpected)
          {
            bot.removeListener("chunkColumnLoad", listener);
            cb();
          }
        };
        bot.on("chunkColumnLoad", listener);
      });
    }

    it("can dig", async () => {
      this.timeout(10 * 60 * 1000);
      await Promise.all([waitSpawnZone(bot, 2), waitSpawnZone(bot2, 2), onGround(bot), onGround(bot2)]);

      const pos = bot.entity.position.offset(0, -1, 0).floored();
      bot.dig(bot.blockAt(pos));

      let [, newBlock] = await once(bot2, "blockUpdate", {array: true});
      assertPosEqual(newBlock.position, pos);
      expect(newBlock.type).toEqual(0);
    });


    it("can place a block", async () => {
      this.timeout(10 * 60 * 1000);
      await Promise.all([waitSpawnZone(bot, 2), waitSpawnZone(bot2, 2), onGround(bot), onGround(bot2)]);

      const pos = bot.entity.position.offset(0, -2, 0).floored();
      bot.dig(bot.blockAt(pos));

      let [oldBlock, newBlock] = await once(bot2, "blockUpdate", {array: true});
      assertPosEqual(newBlock.position, pos);
      expect(newBlock.type).toEqual(0);

      bot.creative.setInventorySlot(36, new mineflayer.Item(1, 1));
      await new Promise((cb) => {
        bot.inventory.on("windowUpdate", (slot, oldItem, newItem) => {
          if(slot == 36 && newItem && newItem.type == 1)
            cb();
        });
      });

      bot.placeBlock(bot.blockAt(pos.offset(0, -1, 0)), new Vec3(0, 1, 0));

      [oldBlock, newBlock] = await once(bot2, "blockUpdate", {array: true});
      assertPosEqual(newBlock.position, pos);
      expect(newBlock.type).toEqual(1);
    });
  });

  describe("commands", () => {

    it("has an help command", async () => {
      await waitLoginMessage(bot);
      bot.chat("/help");
      await once(bot, "message");
    });
    it("can use /particle", async () => {
      bot.chat("/particle 5 10 100 100 100");
      await once(bot._client, "world_particles");
    });
    it("can use /playsound", async () => {
      bot.chat("/playsound ambient.weather.rain");
      await once(bot, "soundEffectHeard");
    });

    function waitDragon()
    {
      return new Promise((done) => {
        const listener = (entity) => {
          if(entity.name == "EnderDragon") {
            bot.removeListener("entitySpawn", listener);
            done();
          }
        };
        bot.on("entitySpawn", listener);
      });
    }

    it("can use /summon", async () => {
      bot.chat("/summon EnderDragon");
      await waitDragon();
    });
    it("can use /kill", async () => {
      bot.chat("/summon EnderDragon");
      await waitDragon();
      bot.chat("/kill @e[type=EnderDragon]");
      const entity = await once(bot, "entityDead");
      expect(entity.name).toEqual("EnderDragon");
    });
    describe("can use /tp", () => {
      it("can tp myself", async () => {
        bot.chat("/tp 2 3 4");
        await once(bot, "forcedMove");
        assertPosEqual(bot.entity.position, new Vec3(2, 3, 4));
      });
      it("can tp somebody else", async () => {
        bot.chat("/tp bot2 2 3 4");
        await once(bot2, "forcedMove");
        assertPosEqual(bot2.entity.position, new Vec3(2, 3, 4));
      });
      it("can tp to somebody else", async () => {
        await onGround(bot);
        bot.chat("/tp bot2 bot");
        await once(bot2, "forcedMove");
        assertPosEqual(bot2.entity.position, bot.entity.position);
      });
      it("can tp with relative positions", async () => {
        await onGround(bot);
        const initialPosition = bot.entity.position.clone();
        bot.chat("/tp ~1 ~-2 ~3");
        await once(bot, "forcedMove");
        assertPosEqual(bot.entity.position, initialPosition.offset(1, -2, 3));
      });
      it("can tp somebody else with relative positions", async () => {
        await Promise.all([onGround(bot), onGround(bot2)]);
        const initialPosition = bot2.entity.position.clone();
        bot.chat("/tp bot2 ~1 ~-2 ~3");
        await once(bot2, "forcedMove");
        assertPosEqual(bot2.entity.position, initialPosition.offset(1, -2, 3));
      });
    });
    it("can use /deop", async () => {
      await waitLoginMessage(bot);
      bot.chat("/deop bot");
      await waitMessage(bot, "bot is deopped");
      bot.chat("/op bot");
      await waitMessage(bot, "You do not have permission to use this command");
      serv.getPlayer("bot").op = true;
    });
    it("can use /setblock", async() => {
      await once(bot, "chunkColumnLoad");
      bot.chat("/setblock 1 2 3 95 0");
      let [, newBlock] = await once(bot, "blockUpdate:" + new Vec3(1, 2, 3), {array: true});
      expect(newBlock.type).toEqual(95);
    });
    it("can use /xp", async() => {
      bot.chat("/xp 100");
      await once(bot, "experience");
      expect(bot.experience.points).toEqual(100);
    });
  });
});
