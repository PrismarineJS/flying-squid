flying-squid
================

[![NPM version](https://img.shields.io/npm/v/flying-squid.svg)](http://npmjs.com/package/flying-squid)
[![Join the chat at https://gitter.im/PrismarineJS/flying-squid](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/PrismarineJS/flying-squid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Minecraft version](https://img.shields.io/badge/minecraft%20version-1.8-brightgreen.svg)](http://wiki.vg/Protocol)
[![Github issues](https://img.shields.io/github/issues/PrismarineJS/flying-squid.svg)](https://img.shields.io/github/issues/PrismarineJS/flying-squid.svg)
[![Build Status](https://img.shields.io/circleci/project/PrismarineJS/flying-squid/master.svg)](https://circleci.com/gh/PrismarineJS/flying-squid)

A semi-functional minecraft server in Node.js

## Features
* Support for Minecraft 1.8
* Players can see the world
* Players see each other in-game and in tab
* Digging
* Placing blocks
* Player movement
* World generation
* Anvil loading
* Multi-world

## Test server

* rom1504.fr (Port 25565) using [auto-squid](https://github.com/rom1504/auto-squid)

## Building / Running
Before running or building it is recommended that you configure the server in `config/settings.json`

    npm install
    node app.js

Or try our autoupdating flying-squid server [autonomous-squid](https://github.com/mhsjlw/autonomous-squid)

You can also install flying-squid globally with `sudo npm install -g flying-squid`
and then run it with `flying-squid` command.

## World generation

There are several modules than can be used to generate the world. The default one is called diamond-square

* [node-voxel-worldgen](https://github.com/mhsjlw/node-voxel-worldgen) a voxel world generator written in Rust, compatible with flying-squid and allows basic minecraft-like generation including caves.
* [diamond-square](https://github.com/PrismarineJS/diamond-square) a diamond square minecraft generation

To install a world generation, all you have to do is npm install it and then change the generation option in settings.json.

## Plugins

* [flying-squid-irc](https://github.com/rom1504/flying-squid-irc) a bridge between a irc chan and the minecraft server.
Currently used between our test server (rom1504.fr) and our gitter room (through the official gitter irc bridge)
* [flying-squid-schematic](https://github.com/rom1504/flying-squid-schematic) Flying-squid plugin providing /listSchemas and /loadSchema commands. 
You can add schema through a simple http api and then add them in your world by just calling /loadSchema in game.
Http api available in the test instance at [flying-squid.rom1504.fr](http://flying-squid.rom1504.fr)
* [flying-squid-modpe](https://github.com/PrismarineJS/flying-squid-modpe) load modpe plugins
* [flying-squid-essentials](https://github.com/DeudlyYT/Flying-Squid-Essentials) Plugin that in a future will be like Essentials of bukkit/spigot.
All the basic commands that a server should have


## Documentation
For development see [API.md](doc/API.md), [CONTRIBUTE.md](doc/CONTRIBUTE.md) and [HISTORY.md](doc/HISTORY.md)

## Using as a lib

flying-squid is also a server lib. Here is a basic example of usage:

```js
var mcServer = require("flying-squid");

mcServer.createMCServer({
  "motd": "A Minecraft Server \nRunning flying-squid",
  "port": 25565,
  "max-players": 10,
  "online-mode": true,
  "logging": true,
  "gameMode": 1,
  "generation": {
    "name": "diamond_square",
    "options":{
      "worldHeight": 80
    }
  },
  "kickTimeout": 10000,
  "plugins": {

  },
  "modpe": false,
  "view-distance": 10
});
```

You can add server plugins and player plugins in your package, following [CONTRIBUTE.md](doc/CONTRIBUTE.md).

## Contributors

 - [@roblabla](https://github.com/roblabla) for helping out with the protocols
 - [@rom1504](https://github.com/rom1504) for massive contributions to the code
 - [@demipixel](https://github.com/demipixel) 
 - The PrismarineJS team for creating prismarine-chunk and node-minecraft-protocol
 - [wiki.vg](http://wiki.vg/Protocol) for documenting minecraft protocols
 - All of our other awesome contributors!
