# MCServer

## Flying-squid.createMCServer(options)

Create and return an instance of the class MCServer.
Options is an object containing the following properties:

* port: default to 25565
* host: default to localhost
* kickTimeout: default to 10*1000 (10s), kick client that doesn't answer to keepalive after that time
* checkTimeoutInterval: defaults to 4*1000 (4s), send keepalive packet at that period
* online-mode: defaults to true
* beforePing: allow customisation of the answer to ping the server does. It takes a function with argument response and client, response is the default json response, and client is client who sent a ping. It can take as third argument a callback. If the callback is passed, the function should pass its result to the callback, if not it should return.
* motd: the string that players see when looking for the server. Defaults to "A Minecraft server"
* max-players: the amount of players on the server. Defaults to 20
* logging: defaults to true, enables logging
* gameMode: defaults to 0, 0 is survival 1 is creative.
* generation: is an object. contains the name and the options for the generator. example:
```json
{
  "name":"diamond_square",
  "options":{
    "worldHeight":80
  }
}
```
* modpe: defaults to false, wether or not modpe should be enabled.
* worldFolder : the world folder of the saved world (containing region, level.dat,...)
* plugins
* view-distance
* player-list-text : an object with keys header and footer, displayed on the player list
* everybody-op : true or false, makes everybody op

## Properties

### server.entityMaxId

The current maximum ID (i.e. the last entity that was spawned has that id)

### server.players

An array of players currently logged in

### server.uuidToPlayer

Object for converting UUIDs to players

### server.overworld

Contains the overworld world. This is where the default spawn point is

### server.netherworld

Contains the nether world. This **WILL** be used when a player travels through a portal if they are in the overworld!

### server.endworld

Contains the end world. **NOT YET IMPLEMENTED!**

### server.entities

All of the entities

### server.bannedPlayers

Object of players that are banned, key is their uuid. Use `server.getUUIDFromUsername()` if you only have their username.

Example player:
```
{
    time: <time in epoch>,
    reason: <reason given>
}
```

### server.time

Current daylight cycle time in ticks. Morning is 0, noon is 6000, evening is 12000, and night is 18000.
Resets to 0 at 24000. Use `server.setTime(time)` to set the time.

### server.tickCount

Total number of ticks that have passed since the start of the world.
Best to use with modulo (e.g. Something every 10 seconds is `server.tickCount % 20*10 === 0`)

### server.doDaylightCycle

Default `true`. If false, time will not automatically pass.

### server.plugins

List of all plugins. Use server.plugins[pluginName] to get a plugin's object and data.

## Events

### "error" (error)

Fires when there is an error.

### "clientError" (client,error)

Fires when `client` has an error.

### "listening" (port)

Fires when the server is listening.

### "newPlayer" (player)

Fires when `player` login, allow external player plugins.

### "banned" (banner,bannedUsername,reason)

`banner` banned `bannedUsername` with `reason`

### "tick" (count)

Fires when one tick has passed (default is 50ms). count is the total world ticks (same as server.tickCount)

## Methods

### server.createLog()

creates the log file

### server.log(message)

logs a `message`

### server.broadcast(message[,color])

broadcasts `message` to all the players with the optional `color`.

### server.getPlayer(username)

Returns player object with that username or, if no such player is on the server, null.

### server.getNearby(loc)

Returns array of players within loc. loc is a required paramater. The object contains:

* world: World position is in
* position: Center position
* radius: Distance from position

### server.banUsername(username,reason,callback)

Bans players given a username. Mainly used if player is not online, otherwise use `player.ban()`.

### server.ban(uuid,reason)

Ban player given a uuid. If the player is online, using `player.ban()`. Bans with reason or `You are banned!`.

### server.pardonUsername(username,callback)

Pardons a player given a username.

### server.pardon(uuid)

Pardons a player given their uuid. Returns `false` if they are not banned.

### server.getUUIDFromUsername(username,callback)

Gets UUID from username. Since it needs to fetch from mojang servers, it is not immediate.

Arguments in format: `callback(uuid)`. `uuid` is null if no such username exists.

### server.setTime(time)

Set daylight cycle time in ticks. See `server.time` for more info.

### server.setTickInterval(ticksPerSecond)

Resets tick interval to occur `ticksPerSecond` times per second.

Use `server.stopTickInterval()` if you want but this method already calls that and you can use `server.doDaylightCycle` to stop it anyway.

### server.setBlock(world, position, blockType, blockData)

Saves block in world and sends block update to all players of the same world.

### server.playSound(sound, world, position, opt)

Plays `sound` (string, google "minecraft sound list") to all players in `opt.radius`. 
If position is null, will play at the location of every player (taking into account whitelist and blacklist).

Opt:
- whitelist: Array of players that can hear the sound (can be a player object)
- blacklist: Array of players who cannot hear the sound
- radius: Radius that sound can be heard (in fixed position so remember to multiply by 32, default 32*32)
- volume: float from 0-1 (default 1.0)
- pitch: float from 0.5 to 2 (default 1.0)

### server.playNoteBlock(world, position, pitch)

Plays noteblock in world at position. `pitch` is from 0-24

### server.getNote(note)

Get pitch. `note` should be between 0-24 and your output is from 0.5 to 2.0

### server.emitParticle(particle, world, position, opt)

Emits particle (see [id list](http://wiki.vg/Protocol#Particle)) at `position` in `world`.

Opt:
- whitelist: Array of players that can see the particle (can be a player object)
- blacklist: Array of players who cannot see the particle
- radius: Radius that the particle can be seen from
- longDistance: I don't know what this is. I think this is pointless with our implenetation of radius, not sure though...
- size: vec3 of the size. (0,0,0) will be at an exact position, (10,10,10) will be very spread out (particles less dense)
- count: Number of particles. 100,000,000+ will crash the client. Try not to go over 100,000 (sincerely, minecraft clients)


## Low level methods

### server._writeAll(packetName, packetFields)

Writes packet to every player on the server

### server._writeArray(packetName, packetFields, playerArray)

Writes packet to every player in playerArray

### server._writeNearby(packetName, packetFields, loc)

Writes packet to all players within distance of loc. loc has the same paramater as loc in server.getNearby()