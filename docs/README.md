FLYING-SQUID
================

[![NPM version](https://img.shields.io/npm/v/flying-squid.svg)](http://npmjs.com/package/flying-squid)
[![Build Status](https://github.com/PrismarineJS/flying-squid/workflows/CI/badge.svg)](https://github.com/PrismarineJS/flying-squid/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Gitter](https://img.shields.io/badge/chat-on%20gitter-brightgreen.svg)](https://gitter.im/PrismarineJS/general)
[![Irc](https://img.shields.io/badge/chat-on%20irc-brightgreen.svg)](https://irc.gitter.im/)


Create Minecraft servers with a powerful, stable, and high level JavaScript API.

## Features
* Support for Minecraft 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15 and 1.16
* Players can see the world
* Players see each other in-game and in tab
* Digging
* Placing blocks
* Player movement
* World generation
* Anvil loading
* Multi-world

## Test server

* flying-squid.host (Port 25565) : hosted by @Saiv46

## Building / Running
Before running or building it is recommended that you configure the server in `config/settings.json`

    npm install
    node app.js

You can also install flying-squid globally with `sudo npm install -g netheritejs/flying-squid`
and then run it with `flying-squid` command.

### Docker

Docker allows a higher level of isolation, compatibily and consistency. You can learn how to install Docker [here](https://www.docker.com/get-started)

```bash
docker run netheritejs/flying-squid

```
With specific flying-squid configuration, container name and the most important, opening the port to flying-squid:

```bash
docker run -p 25565:25565 -v $(pwd)/config:/config --name my-flying-squid --rm netheritejs/flying-squid
```

[docker-compose](https://docs.docker.com/compose/) is useful to quickly launch & stop a single container with a specific configuration.

```yaml
version: '3.8'

services:
  flying-squid:
    image: prismarinejs/flying-squid
    volumes:
       - ${PWD}/config:/config
    ports:
      - "25565:25565"
volumes:
  flying-squid:
```

```bash
docker-compose -f path/to/docker-compose.yaml up
```


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
* [squidcord](https://github.com/dada513/SquidCord) a bridge between a discord channel and the minecraft server.
* [authme](https://github.com/TheAlan404/flying-squid-authme) an auth plugin for `online-mode=false` servers.

## Documentation
For development see the [API documentation](API.md), [CONTRIBUTE.md](CONTRIBUTE.md) and [HISTORY.md](HISTORY.md)

## Using as a lib

flying-squid is also a server lib. Here is a basic example of usage:

```js
const mcServer = require('flying-squid')

mcServer.createMCServer({
  'motd': 'A Minecraft Server \nRunning flying-squid',
  'port': 25565,
  'max-players': 10,
  'online-mode': true,
  'logging': true,
  'gameMode': 1,
  'difficulty': 1,
  'worldFolder':'world',
  'generation': {
    'name': 'diamond_square',
    'options':{
      'worldHeight': 80
    }
  },
  'kickTimeout': 10000,
  'plugins': {

  },
  'modpe': false,
  'view-distance': 10,
  'player-list-text': {
    'header':'Flying squid',
    'footer':'Test server'
  },
  'everybody-op': true,
  'max-entities': 100,
  'version': '1.16.1'
})
```

You can add server plugins and player plugins in your package, following [CONTRIBUTE.md](https://github.com/NetheriteJS/flying-squid/blob/master/docs/CONTRIBUTE.md).

For further examples, see the [examples page.](https://PrismarineJS.github.io/flying-squid/#/examples)

## Contributors

 - [@mhsjlw](https://github.com/mhsjlw) creator of flying-squid
 - [@roblabla](https://github.com/roblabla) for helping out with the protocols
 - [@rom1504](https://github.com/rom1504) for massive contributions to the code
 - [@demipixel](https://github.com/demipixel) 
 - The PrismarineJS team for creating prismarine-chunk and node-minecraft-protocol
 - [wiki.vg](http://wiki.vg/Protocol) for documenting minecraft protocols
 - [@NetheriteJS](https://github.com/netheriteJS) for creating new version of flying-squid
 - All of our other awesome contributors!
