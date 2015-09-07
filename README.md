Flying-squid
================

[![NPM version](https://img.shields.io/npm/v/flying-squid.svg)](http://npmjs.com/package/flying-squid)
[![Join the chat at https://gitter.im/mhsjlw/flying-squid](https://badges.gitter.im/Join%20Chat.svg)]
(https://gitter.im/mhsjlw/flying-squid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Minecraft version](https://img.shields.io/badge/minecraft%20version-1.8-brightgreen.svg)](http://wiki.vg/Protocol)
[![Github issues](https://img.shields.io/github/issues/mhsjlw/flying-squid.svg)]
(https://img.shields.io/github/issues/mhsjlw/flying-squid.svg)
[![Build Status](https://img.shields.io/circleci/project/mhsjlw/flying-squid/master.svg)]
(https://circleci.com/gh/mhsjlw/flying-squid)
[![Gratipay](https://img.shields.io/gratipay/mhsjlw.svg)]
(https://gratipay.com/~mhsjlw/)

A semi-functional minecraft server in Node.js

## Features
* Support minecraft 1.8
* Players can see the world
* Players see each other in-game and in tab
* Digging
* Placing blocks
* Player movement
* Modpe plugin support

## ModPE Support

A source of ModPE support is located here: https://github.com/Creeplays/modpe-squid

## Test servers

* rom1504.fr (Port 25565) using [auto-squid](https://github.com/rom1504/auto-squid)
* 45.55.46.77 (Port 25565) using [autonomous-squid](https://github.com/mhsjlw/autonomous-squid)
* 52.88.57.17 (Port 25552) using [autonomous-squid](https://github.com/mhsjlw/autonomous-squid)

## Building / Running
Before running or building it is recommended that you configure the server in config/settings.json

    npm install
    node app.js

Or try our autoupdating flying-squid server [autonomous-squid](https://github.com/mhsjlw/autonomous-squid)

You can also install flying-squid globally with `sudo npm install -g flying-squid`
and then run it with `flying-squid` command.

## Documentation
Documentation for how to operate and how to customize your server are coming soon!

## Dev Documentation
For development see [api.md](doc/api.md), [contribute.md](doc/contribute.md) and [history.md](doc/history.md)

## Using as a lib

Flying-squid is also a server lib. Here is a basic example of usage :

```js
var mcServer = require("flying-squid");
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
```

ModPE wrapping can be disabed by commenting "modpeWrap(serv)" line. 

You can add server plugins and player plugins in your package, following [contribute.md](doc/contribute.md).

## Contributors

 - @roblabla for helping out with the protocols
 - @rom1504 for massive contributions to the code
 - The PrismarineJS team for creating prismarine-chunk and node-minecraft-protcol
 - [wiki.vg](http://wiki.vg/Protocol) for documenting minecraft protocols
