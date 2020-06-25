# Examples

## Basic Server

```js
const mcServer = require('flying-squid')

mcServer.createMCServer({
  'motd': 'A Minecraft Server \nRunning flying-squid',
  'port': 25565,
  'max-players': 10,
  'online-mode': true,
  'logging': true,
  'gameMode': 1,
  'generation': {
    'name': 'diamond_square',
    'options': {
      'worldHeight': 80
    }
  },
  'kickTimeout': 10000,
  'plugins': {

  },
  'modpe': false,
  'view-distance': 10
})
```

## Server Plugin

When a block gets a random tick, convert the grass to stone

```js
module.exports.server = function(serv) {
  serv.on('randomTickBlock', ({ world, position, blockType }) => {
    if (blockType === 2) { // If grass
      serv.setBlock(world, position, 1, 0); // Change to stone (id 1, data 0)
    }
  })
}
```

## Basic Player Plugin

Add basic text sent to user on spawn and add a random command

```js
module.exports.player = function(player, serv) {
  player.on('spawned', () => { // Say hey to the user!
    player.chat(`Welcome to a ${serv.color.green}Flying Squid Server${serv.color.reset}!`);
  });
}

module.exports.server = function(serv) {
  // Commands are added there only.
  serv.commands.add({
    base: 'random', // This is what the user starts with, so in this case: /random
    info: 'Returns a random number from 0 to num', // Description of the command
    usage: '/random <num>', // Usage displayed if parse() returns false (which means they used it incorrectly)
    parse(str) { // str contains everything after "/random "
      const match = str.match(/^\d+$/); // Check to see if they put numbers in a row
      if (!match) return false; // Anything else, show them the usage
      else return parseInt(match[0]); // Otherwise, pass our number as an int to action()
    },
    action(maxNumber, ctx) { // ctx - context who is using it
      const number = Math.floor(Math.random()*(maxNumber+1)); // Generate our random number
      if(ctx.player) player.chat(number); // If context of the player send it to him
      else serv.log(number); // If not, log it.
    }
  })
}
```

## Advanced Player Plugin

Example of a plugin that doesn't change actual blocks in world but converts some blocks to glass when sent to the player.
Be aware, this does not change future blocks placed for the user (you would need to listen to the `placeBlock` event).

```js
// original_block_id: [new_block_id, new_block_data]
// 95 is colored glass, the data is the color of the glass
const changeBlock = {
  1: [95, 7], // Stone to grey glass
  2: [95, 5], // Grass to green glass
  3: [95, 12], // Dirt to brown glass
  9: [95, 11] // Still water to blue glass
}

module.exports.player = function(player, serv) {
  player.on('sendChunk', async (data, cancelled) => { // When sending chunks, intercept, replace blocks neccesary, then continue sending
    if (cancelled) return;
    const chunk = new Chunk(); // Duplicate chunk so we don't edit the actual world
    chunk.load(new Buffer(data.chunk.dump()));
    
    // Go through every block in the chunk
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y < 256; y++) {
          const vec = new Vec3(x, y, z);
          const id = chunk.getBlockType(vec); // Get id of block at the current location
          if (self.changeBlock[id]) { // If for this block type we have a glass color to convert it to
            chunk.setBlockType(vec, self.changeBlock[id][0]); // Edit block
            if (self.changeBlock[id].length > 1) chunk.setBlockData(vec, self.changeBlock[id][1])
          }
        }
      }
    }
    data.chunk = chunk; // Change the chunk being sent to our new chunk
  })
}
```