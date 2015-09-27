<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [API](#api)
  - [Classes](#classes)
    - [Entity](#entity)
  - [MCServer](#mcserver)
    - [Flying-squid.createMCServer(options)](#flying-squidcreatemcserveroptions)
    - [Properties](#properties)
      - [serv.entityMaxId](#serventitymaxid)
      - [serv.players](#servplayers)
      - [serv.uuidToPlayer](#servuuidtoplayer)
      - [serv.world](#servworld)
      - [serv.entities](#serventities)
      - [serv.bannedPlayers](#servbannedplayers)
    - [Events](#events)
      - ["error" (error)](#error-error)
      - ["listening" (port)](#listening-port)
      - ["newPlayer" (player)](#newplayer-player)
      - ["banned" (banner,bannedUsername,reason)](#banned-bannerbannedusernamereason)
    - [Methods](#methods)
      - [serv.createLog()](#servcreatelog)
      - [serv.log(message)](#servlogmessage)
      - [serv.broadcast(message[,color])](#servbroadcastmessagecolor)
      - [serv.setBlock(position,blockType)](#servsetblockpositionblocktype)
      - [serv.getPlayer(username)](#servgetplayerusername)
      - [server.banUsername(username,reason,callback)](#serverbanusernameusernamereasoncallback)
      - [server.ban(uuid,reason)](#serverbanuuidreason)
      - [server.pardonUsername(username,callback)](#serverpardonusernameusernamecallback)
      - [server.pardon(uuid)](#serverpardonuuid)
      - [server.getUUIDFromUsername(username,callback)](#servergetuuidfromusernameusernamecallback)
  - [Player](#player)
    - [Properties](#properties-1)
      - [player.entity](#playerentity)
      - [player.username](#playerusername)
    - [Events](#events-1)
      - ["connected"](#connected)
      - ["spawned"](#spawned)
      - ["disconnected"](#disconnected)
      - ["error" (error)](#error-error-1)
      - ["chat" (message)](#chat-message)
      - ["kicked" (kicker,reason)](#kicked-kickerreason)
    - [Methods](#methods-1)
      - [player.login()](#playerlogin)
      - [player.ban(reason)](#playerbanreason)
      - [player.kick(reason)](#playerkickreason)
      - [player.getOthers()](#playergetothers)
      - [player.chat(message)](#playerchatmessage)
      - [player.changeBlock(position,blockType)](#playerchangeblockpositionblocktype)
      - [player.sendBlock(position,blockType)](#playersendblockpositionblocktype)
      - [player.sendInitialPosition()](#playersendinitialposition)
      - [player.spawn()](#playerspawn)
      - [player.setGameMode(gameMode)](#playersetgamemodegamemode)
      - [player.handleCommand(command)](#playerhandlecommandcommand)
      - [player.updateHealth(health)](#playerupdatehealthhealth)
    - [Low level properties](#low-level-properties)
      - [player._client](#player_client)
    - [Low level methods](#low-level-methods)
      - [player._writeOthers(packetName, packetFields)](#player_writeotherspacketname-packetfields)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# API

## Classes

### Entity
See [prismarine-entity](https://github.com/PrismarineJS/prismarine-entity)

## MCServer

### Flying-squid.createMCServer(options)

Create and return an instance of the class MCServer.

options is an object containing the settings

### Properties

#### serv.entityMaxId

Current maximum entity id

#### serv.players

Array of connected players

#### serv.uuidToPlayer

Object uuid to players

#### serv.world

The map

#### serv.entities

All of the entities

#### serv.bannedPlayers

Object of players that are banned, key is their uuid. Use `serv.getUUIDFromUsername()` if you only have their username.

Example player:
```
{
    time: <time in epoch>,
    reason: <reason given>
}
```

### Events

#### "error" (error)

Fires when there is an error.

#### "listening" (port)

Fires when the server is listening.

#### "newPlayer" (player)

Fires when `player` login, allow external player plugins.

#### "banned" (banner,bannedUsername,reason)

`banner` banned `bannedUsername` with `reason`

### Methods

#### serv.createLog()

creates the log file

#### serv.log(message)

logs a `message`

#### serv.broadcast(message[,color])

broadcasts `message` to all the players with the optional `color`.

#### serv.setBlock(position,blockType)

Saves block in world and sends block update to all players.

#### serv.getPlayer(username)

Returns player object with that username or, if no such player is on the server, null.

#### server.banUsername(username,reason,callback)

Bans players given a username. Mainly used if player is not online, otherwise use `player.ban()`.

#### server.ban(uuid,reason)

Ban player given a uuid. If the player is online, using `player.ban()`. Bans with reason or `You are banned!`.

#### server.pardonUsername(username,callback)

Pardons a player given a username.

#### server.pardon(uuid)

Pardons a player given their uuid. Returns `false` if they are not banned.

#### server.getUUIDFromUsername(username,callback)

Gets UUID from username. Since it needs to fetch from mojang servers, it is not immediate.

Arguments in format: `callback(uuid)`. `uuid` is null if no such username exists.

## Player

### Properties

#### player.entity

The entity of the player, of type `Flying-squid.Entity`

#### player.username

The username of the player

### Events

#### "connected" 

Fires when the player is connected

#### "spawned"

Fires when the player is spawned

#### "disconnected"

Fires when the player disconnected

#### "error" (error)

Fires when there is an error.

#### "chat" (message)

Fires when the player says `message`.

#### "kicked" (kicker,reason)

`kicker` kick the player with `reason`

### Methods

#### player.login()

login

#### player.ban(reason)

bans player with `reason`

#### player.kick(reason)

kicks player with `reason`

#### player.getOthers()

return the other players than `player`

#### player.chat(message)

sends `message` to the player

#### player.changeBlock(position,blockType)

change the block at position `position` to `blockType`

this will not change the block for the user themself. It is mainly useful when a user places a block 
and only needs to send it to other players on the server

#### player.sendBlock(position,blockType)

change the block at position `position` to `blockType`

this will not make any changes on the server's world and only sends it to the user as a "fake" or "local" block

#### player.sendInitialPosition()

send its initial position to the player

#### player.spawn()

tell everybody else that the player spawned

#### player.setGameMode(gameMode)

set player gameMode to `gameMode`

#### player.handleCommand(command)

handle `command`

#### player.updateHealth(health)

update the player health.

### Low level properties

#### player._client

The internal implementation to communicate with a client

### Low level methods

#### player._writeOthers(packetName, packetFields)

write to other players than `player` the packet `packetName` with fields `packetFields`
