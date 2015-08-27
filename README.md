Craftyjs
================

[![Join the chat at https://gitter.im/mhsjlw/craftyjs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mhsjlw/craftyjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mhsjlw/craftyjs/blob/master/LICENSE)
[![Minecraft version](https://img.shields.io/badge/minecraft%20version-1.8-brightgreen.svg)](http://wiki.vg/Protocol)
[![Github issues](https://img.shields.io/github/issues/mhsjlw/craftyjs.svg)](https://img.shields.io/github/issues/mhsjlw/craftyjs.svg)
[![Build Status](https://img.shields.io/circleci/project/mhsjlw/craftyjs/master.svg)](https://circleci.com/gh/mhsjlw/craftyjs) [![Gratipay](https://img.shields.io/gratipay/mhsjlw.svg)](https://gratipay.com/~mhsjlw/)

A semi-functional minecraft server in Node.js

## Docker confirmed
![Docker](http://i.imgur.com/vvi4jt8.png)

## Features
* Support minecraft 1.8
* Players can see the world
* Players see each other in-game and in tab
* Digging
* Placing blocks
* Player movement

## Test server!
We created an auto updating test server (see the repository [here](https://github.com/mhsjlw/auto-craftyjs))

Connection address: 45.55.62.8 (Port 25565, default port)

## Building / Running
Before running or building it is recommended that you configure the server in config/settings.json

    npm install
    node app.js

Or try our autoupdating craftyjs server [auto-craftyjs](https://github.com/mhsjlw/auto-craftyjs)

## Documentation
Documentation for how to operate and how to customize your server are coming soon!

## Dev Documentation
For development see [api.md](doc/api.md) and [contribute.md](doc/contribute.md)

## Contributors

 - @roblabla for helping out with the protocols
 - @rom1504 for massive contributions to the code
 - The PrismarineJS team for creating prismarine-chunk and node-minecraft-protcol
 - [wiki.vg](http://wiki.vg/Protocols) for documenting minecraft protocols
