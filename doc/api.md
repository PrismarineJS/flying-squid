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
      - [serv.overworld](#servoverworld)
      - [serv.netherworld](#servnetherworld)
      - [serv.endworld](#servendworld)
      - [serv.entities](#serventities)
      - [serv.bannedPlayers](#servbannedplayers)
      - [serv.time](#servtime)
      - [serv.tickCount](#servtickcount)
      - [serv.doDaylightCycle](#servdodaylightcycle)
    - [Events](#events)
      - ["error" (error)](#error-error)
      - ["listening" (port)](#listening-port)
      - ["newPlayer" (player)](#newplayer-player)
      - ["banned" (banner,bannedUsername,reason)](#banned-bannerbannedusernamereason)
      - ["tick" (count)](#tick-count)
    - [Methods](#methods)
      - [serv.createLog()](#servcreatelog)
      - [serv.log(message)](#servlogmessage)
      - [serv.broadcast(message[,color])](#servbroadcastmessagecolor)
      - [serv.getPlayer(username)](#servgetplayerusername)
      - [serv.getNearby(loc)](#servgetnearbyloc)
      - [server.banUsername(username,reason,callback)](#serverbanusernameusernamereasoncallback)
      - [server.ban(uuid,reason)](#serverbanuuidreason)
      - [server.pardonUsername(username,callback)](#serverpardonusernameusernamecallback)
      - [server.pardon(uuid)](#serverpardonuuid)
      - [server.getUUIDFromUsername(username,callback)](#servergetuuidfromusernameusernamecallback)
      - [server.setTime(time)](#serversettimetime)
      - [server.setTickInterval(ticksPerSecond)](#serversettickintervaltickspersecond)
    - [Low level methods](#low-level-methods)
      - [server._writeAll(packetName, packetFields)](#server_writeallpacketname-packetfields)
      - [server._writeArray(packetName, packetFields, playerArray)](#server_writearraypacketname-packetfields-playerarray)
      - [server._writeNearby(packetName, packetFields, loc)](#server_writenearbypacketname-packetfields-loc)
  - [Player](#player)
    - [Properties](#properties-1)
      - [player.entity](#playerentity)
      - [player.username](#playerusername)
      - [player.view](#playerview)
      - [player.world](#playerworld)
      - [player.nearbyPlayers](#playernearbyplayers)
    - [Events](#events-1)
      - ["connected"](#connected)
      - ["spawned"](#spawned)
      - ["disconnected"](#disconnected)
      - ["error" (error)](#error-error-1)
      - ["chat" (message)](#chat-message)
      - ["kicked" (kicker,reason)](#kicked-kickerreason)
      - ["positionChanged"](#positionchanged)
    - [Methods](#methods-1)
      - [player.login()](#playerlogin)
      - [player.ban(reason)](#playerbanreason)
      - [player.kick(reason)](#playerkickreason)
      - [player.getOthers()](#playergetothers)
      - [player.chat(message)](#playerchatmessage)
      - [player.changeBlock(position,blockType)](#playerchangeblockpositionblocktype)
      - [player.sendBlock(position,blockType)](#playersendblockpositionblocktype)
      - [player.sendInitialPosition()](#playersendinitialposition)
      - [player.setGameMode(gameMode)](#playersetgamemodegamemode)
      - [player.handleCommand(command)](#playerhandlecommandcommand)
      - [player.setBlock(position,blockType)](#playersetblockpositionblocktype)
      - [player.updateHealth(health)](#playerupdatehealthhealth)
      - [player.changeWorld(world, opt)](#playerchangeworldworld-opt)
      - [player.spawnAPlayer(spawnedPlayer)](#playerspawnaplayerspawnedplayer)
      - [player.despawnPlayers(despawnedPlayers)](#playerdespawnplayersdespawnedplayers)
      - [player.updateAndSpawnNearbyPlayers()](#playerupdateandspawnnearbyplayers)
    - [Low level properties](#low-level-properties)
      - [player._client](#player_client)
    - [Low level methods](#low-level-methods-1)
      - [player._writeOthers(packetName, packetFields)](#player_writeotherspacketname-packetfields)
      - [player._writeOthersNearby(packetName, packetFields)](#player_writeothersnearbypacketname-packetfields)

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

#### serv.overworld

Contains the overworld world. This is where the default spoint is and where peope will play survival and such.

#### serv.netherworld

Contains the nether world. This WILL be used when a player travels through a portal if they are in the overworld.

#### serv.endworld

WILL contain the end world. *NOT YET IMPLEMENTED!*

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

#### serv.time

Current daylight cycle time in ticks. Morning is 0, noon is 6000, evening is 12000, and night is 18000.
Resets to 0 at 24000. Use `serv.setTime(time)` to set the time.

#### serv.tickCount

Total number of ticks that have passed since the start of the world.
Best to use with modulo (e.g. Something every 10 seconds is `serv.tickCount % 20*10 == 0`)

#### serv.doDaylightCycle

Default `true`. If false, time will not automatically pass.

### Events

#### "error" (error)

Fires when there is an error.

#### "listening" (port)

Fires when the server is listening.

#### "newPlayer" (player)

Fires when `player` login, allow external player plugins.

#### "banned" (banner,bannedUsername,reason)

`banner` banned `bannedUsername` with `reason`

#### "tick" (count)

Fires when one tick has passed (default is 50ms). count is the total world ticks (same as serv.tickCount)

### Methods

#### serv.createLog()

creates the log file

#### serv.log(message)

logs a `message`

#### serv.broadcast(message[,color])

broadcasts `message` to all the players with the optional `color`.

#### serv.getPlayer(username)

Returns player object with that username or, if no such player is on the server, null.

#### serv.getNearby(loc)

Returns array of players within loc. loc is a required paramater. The object contains:

* world: World position is in
* position: Center position
* radius: Distance from position

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

#### server.setTime(time)

Set daylight cycle time in ticks. See `serv.time` for more info.

#### server.setTickInterval(ticksPerSecond)

Resets tick interval to occur `ticksPerSecond` times per second.

Use `server.stopTickInterval()` if you want but this method already calls that and you can use `serv.doDaylightCycle` to stop it anyway.

### Low level methods

#### server._writeAll(packetName, packetFields)

Writes packet to every player on the server

#### server._writeArray(packetName, packetFields, playerArray)

Writes packet to every player in playerArray

#### server._writeNearby(packetName, packetFields, loc)

Writes packet to all players within distance of loc. loc has the same paramater as loc in server.getNearby()

## Player

### Properties

#### player.entity

The entity of the player, of type `Flying-squid.Entity`

#### player.username

The username of the player

#### player.view

The view size of the player, for example 8 for 16x16

#### player.world

The world which the player is in.

#### player.nearbyPlayers

Nearby players.

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

#### "positionChanged"

fires when the position changes in small amounts (walking, running, or flying)

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

#### player.setGameMode(gameMode)

set player gameMode to `gameMode`

#### player.handleCommand(command)

handle `command`

#### player.setBlock(position,blockType)

Saves block in world and sends block update to all players of the same world.

#### player.updateHealth(health)

update the player health.

#### player.changeWorld(world, opt)

The world object which the player is in (use serv.overworld, serv.netherworld, serv.endworld, or a custom world). Options:

- gamemode: Gamemode of the world (Default is player gamemode)
- difficulty: Difficulty of world. Default is 0 (easiest)
- dimension: Dimension of world. 0 is Overworld, -1 is Nether, 1 is End (Default is 0)
- position: Position player spawns, default is their default spawn point
- yaw: Yaw in which they spawn, default is 0
- pitch: Pitch in which they spawn, default is 0


#### player.spawnAPlayer(spawnedPlayer)

Spawn `spawnedPlayer` for `player`.

#### player.despawnPlayers(despawnedPlayers)

Despawn `despawnedPlayers` for `player`.

#### player.updateAndSpawnNearbyPlayers()

Spawn and despawn the correct players depending on distance for `player`.

### Low level properties

#### player._client

The internal implementation to communicate with a client

### Low level methods

#### player._writeOthers(packetName, packetFields)

write to other players than `player` the packet `packetName` with fields `packetFields`

#### player._writeOthersNearby(packetName, packetFields)

write to other players in same world that are within 150 blocks (see player.getNearby())
