<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [API](#api)
  - [Classes](#classes)
    - [Entity](#entity)
    - [flying-squid.Command](#flying-squidcommand)
    - [flying-squid.Behavior](#flying-squidbehavior)
    - [Libs](#libs)
    - [flying-squid.generations](#flying-squidgenerations)
    - [flying-squid.version](#flying-squidversion)
    - [flying-squid.experience](#flying-squidexperience)
      - [getXpLevel(xp)](#getxplevelxp)
      - [getXpRequired(level, toLevel=level+1)](#getxprequiredlevel-tolevellevel1)
      - [getBaseXpFromLevel(level)](#getbasexpfromlevellevel)
      - [distanceToXpLevel(xp, toLevel=startLevel+1, startLevel=xp level)](#distancetoxplevelxp-tolevelstartlevel1-startlevelxp-level)
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
      - [serv.plugins](#servplugins)
      - [serv.tabComplete](#servtabcomplete)
    - [Events](#events)
      - ["error" (error)](#error-error)
      - ["clientError" (client,error)](#clienterror-clienterror)
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
      - [serv.onItemPlace(name, handler)](#servonitemplacename-handler)
      - [serv.onBlockInteraction(name, handler)](#servonblockinteractionname-handler)
      - [serv.onBlockUpdate(name, handler)](#servonblockupdatename-handler)
      - [serv.updateBlock(world, pos, fromTick, tick, forceNotify = false, data = null)](#servupdateblockworld-pos-fromtick-tick-forcenotify--false-data--null)
      - [serv.notifyNeighborsOfStateChange(world, pos, fromTick, tick, forceNotify = false, data = null)](#servnotifyneighborsofstatechangeworld-pos-fromtick-tick-forcenotify--false-data--null)
      - [serv.notifyNeighborsOfStateChangeDirectional(world, pos, dir, fromTick, tick, forceNotify = false, data = null)](#servnotifyneighborsofstatechangedirectionalworld-pos-dir-fromtick-tick-forcenotify--false-data--null)
      - [server.banUsername(username,reason,callback)](#serverbanusernameusernamereasoncallback)
      - [server.ban(uuid,reason)](#serverbanuuidreason)
      - [server.pardonUsername(username,callback)](#serverpardonusernameusernamecallback)
      - [server.pardon(uuid)](#serverpardonuuid)
      - [server.getUUIDFromUsername(username,callback)](#servergetuuidfromusernameusernamecallback)
      - [server.setTime(time)](#serversettimetime)
      - [server.setTickInterval(ticksPerSecond)](#serversettickintervaltickspersecond)
      - [server.setBlock(world, position, blockType, blockData)](#serversetblockworld-position-blocktype-blockdata)
      - [server.setBlockAction(world, position, actionId, actionParam)](#serversetblockactionworld-position-actionid-actionparam)
      - [server.playSound(sound, world, position, opt)](#serverplaysoundsound-world-position-opt)
      - [server.playNoteBlock(world, position, pitch)](#serverplaynoteblockworld-position-pitch)
      - [server.getNote(note)](#servergetnotenote)
      - [server.emitParticle(particle, world, position, opt)](#serveremitparticleparticle-world-position-opt)
    - [Low level methods](#low-level-methods)
      - [server._writeAll(packetName, packetFields)](#server_writeallpacketname-packetfields)
      - [server._writeArray(packetName, packetFields, playerArray)](#server_writearraypacketname-packetfields-playerarray)
      - [server._writeNearby(packetName, packetFields, loc)](#server_writenearbypacketname-packetfields-loc)
  - [Entity](#entity-1)
    - [Properties](#properties-1)
      - [entity.id](#entityid)
      - [entity.position](#entityposition)
      - [entity.world](#entityworld)
      - [entity.type](#entitytype)
      - [entity.entityType](#entityentitytype)
      - [entity.name](#entityname)
      - [entity.nearbyEntities](#entitynearbyentities)
      - [entity.viewDistance](#entityviewdistance)
      - [entity.health](#entityhealth)
      - [entity.pitch](#entitypitch)
      - [entity.headPitch](#entityheadpitch)
      - [entity.yaw](#entityyaw)
      - [entity.gravity](#entitygravity)
      - [entity.terminalvelocity](#entityterminalvelocity)
      - [entity.friction](#entityfriction)
      - [entity.size](#entitysize)
      - [entity.deathTime](#entitydeathtime)
      - [entity.pickupTime](#entitypickuptime)
      - [entity.bornTime](#entityborntime)
      - [entity.itemId](#entityitemid)
      - [entity.itemDamage](#entityitemdamage)
      - [entity.metadata](#entitymetadata)
      - [entity.nearbyEntities](#entitynearbyentities-1)
    - [Events](#events-1)
    - [Behaviors](#behaviors)
      - [FORMAT](#format)
      - ["move"](#move)
    - [Methods](#methods-1)
      - [entity.getData(pluginName)](#entitygetdatapluginname)
      - [entity.getOthers()](#entitygetothers)
      - [entity.getOtherPlayers()](#entitygetotherplayers)
      - [entity.getNearby()](#entitygetnearby)
      - [entity.getNearbyPlayers()](#entitygetnearbyplayers)
      - [entity.nearbyPlayers()](#entitynearbyplayers)
      - [entity.takeDamage({sound='game.player.hurt', damage=1, velocity=new Vec3(0,0,0), maxVelocity=new Vec3(4, 4, 4), animation=true})](#entitytakedamagesoundgameplayerhurt-damage1-velocitynew-vec3000-maxvelocitynew-vec34-4-4-animationtrue)
    - [Low level Methods](#low-level-methods)
      - [entity._writeOthers(packetName, packetFields)](#entity_writeotherspacketname-packetfields)
      - [entity._writeOthersNearby(packetName, packetFields)](#entity_writeothersnearbypacketname-packetfields)
  - [Player](#player)
    - [Properties](#properties-2)
      - [player.username](#playerusername)
      - [player.view](#playerview)
      - [player.xp](#playerxp)
      - [player.displayXp](#playerdisplayxp)
      - [player.xpLevel](#playerxplevel)
    - [Events](#events-2)
      - ["connected"](#connected)
      - ["spawned"](#spawned)
      - ["disconnected"](#disconnected)
      - ["chat" (message)](#chat-message)
      - ["kicked" (kicker,reason)](#kicked-kickerreason)
      - ["positionChanged"](#positionchanged)
    - [Behaviors](#behaviors-1)
      - ["move"](#move-1)
      - ["look"](#look)
      - ["chat"](#chat)
      - ["command"](#command)
      - ["punch"](#punch)
      - ["sendBlock"](#sendblock)
      - ["sendBlockAction"](#sendblockaction)
      - ["sendChunk"](#sendchunk)
      - ["dig"](#dig)
      - ["dug"](#dug)
      - ["cancelDig"](#canceldig)
      - ["forceCancelDig"](#forcecanceldig)
        - ["breakAnimation"](#breakanimation)
      - ["placeBlock"](#placeblock)
      - ["attack"](#attack)
      - ["requestRespawn"](#requestrespawn)
    - [Methods](#methods-2)
      - [player.login()](#playerlogin)
      - [player.ban(reason)](#playerbanreason)
      - [player.kick(reason)](#playerkickreason)
      - [player.getOthers()](#playergetothers)
      - [player.chat(message)](#playerchatmessage)
      - [player.changeBlock(position,blockType,blockData)](#playerchangeblockpositionblocktypeblockdata)
      - [player.sendBlock(position,blockType,blockData)](#playersendblockpositionblocktypeblockdata)
      - [player.sendBlockAction(position,actionId,actionParam,blockType)](#playersendblockactionpositionactionidactionparamblocktype)
      - [player.sendInitialPosition()](#playersendinitialposition)
      - [player.setGameMode(gameMode)](#playersetgamemodegamemode)
      - [player.handleCommand(command)](#playerhandlecommandcommand)
      - [player.setBlock(position,blockType,blockData)](#playersetblockpositionblocktypeblockdata)
      - [player.setBlockAction(position,actionId,actionParam)](#playersetblockactionpositionactionidactionparam)
      - [player.updateHealth(health)](#playerupdatehealthhealth)
      - [player.updateFood(health)](#playerupdatefoodfood)
      - [player.updateFoodSaturation(health)](#playerupdatefoodsaturationfoodsaturation)
      - [player.changeWorld(world, opt)](#playerchangeworldworld-opt)
      - [player.spawnAPlayer(spawnedPlayer)](#playerspawnaplayerspawnedplayer)
      - [player.updateAndSpawnNearbyPlayers()](#playerupdateandspawnnearbyplayers)
      - [player.playSound(sound, opt)](#playerplaysoundsound-opt)
      - [player.setXp(xp, opt)](#playersetxpxp-opt)
      - [player.sendXp()](#playersendxp)
      - [player.setXpLevel(level)](#playersetxplevellevel)
      - [player.setDisplayXp(num)](#playersetdisplayxpnum)
    - [Low level properties](#low-level-properties)
      - [player._client](#player_client)
    - [Low level methods](#low-level-methods-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# API

## Classes

### Entity
See [prismarine-entity](https://github.com/PrismarineJS/prismarine-entity)

### flying-squid.Command

### flying-squid.Behavior

### Libs

Collections of pure functions

### flying-squid.generations

### flying-squid.version

### flying-squid.experience

#### getXpLevel(xp)

Get level given XP amount

#### getXpRequired(level, toLevel=level+1)

Get's the amount of xp required to get from level to toLevel (or level to level+1)

#### getBaseXpFromLevel(level)

Gets the minimum amount of xp required to be at that level (or "base xp" for that level)

#### distanceToXpLevel(xp, toLevel=startLevel+1, startLevel=xp level)

Gets a number between 0 and 1 (used in player.displayXp as the green bar at the bottom) that is the progress of xp between startLevel and toLevel.

By default, startLevel will be the xp's lowest possible level: getXpLevel(xp)

By default, toLevel is startLevel + 1.

This means when startLevel and toLevel are at their defaults, this function returns the progress to the next level of XP (from 0.0 to 1.0)

## MCServer

### Flying-squid.createMCServer(options)

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

### Properties

#### serv.entityMaxId

The current maximum ID (i.e. the last entity that was spawned has that id)

#### serv.players

An array of players currently logged in

#### serv.uuidToPlayer

Object for converting UUIDs to players

#### serv.overworld

Contains the overworld world. This is where the default spawn point is

#### serv.netherworld

Contains the nether world. This **WILL** be used when a player travels through a portal if they are in the overworld!

#### serv.endworld

Contains the end world. **NOT YET IMPLEMENTED!**

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
Best to use with modulo (e.g. Something every 10 seconds is `serv.tickCount % 20*10 === 0`)

#### serv.doDaylightCycle

Default `true`. If false, time will not automatically pass.

#### serv.plugins

List of all plugins. Use serv.plugins[pluginName] to get a plugin's object and data.

#### serv.commands

Instance of the [Command](#flying-squidcommand) class.
``serv.commands`` contains all commands of the server.
Here is an example to create a new command :
```js
serv.commands.add({
    base: 'hello',
    info: 'print hello in the console',
    usage: 'hello <pseudo>',
    parse(str)  {
      const args=str.split(' ');
      if(args.length!=1)
        return false;
       
      return {pseudo:args[0]};
    },
    action({pseudo}, ctx) {
      if (ctx.player) player.chat("Hello "+pseudo);
      else serv.log("Hello "+pseudo);
    }
});
```

#### serv.tabComplete

`serv.tabComplete` has types and tab completition function

You can provide your types:
```js
serv.tabComplete.add('tabId', () => {
  return ['some', 'values', 'in array', 'ONLY STRINGS!']
})
```

### Events

#### "error" (error)

Fires when there is an error.

#### "clientError" (client,error)

Fires when `client` has an error.

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

#### serv.onItemPlace(name, handler)

Register a handler that will be called when an item of type `name` is called to place a block.

The argument given to the handler is an object containing the held item that triggered the event, the direction (face) on which the player clicked, the angle of the player around the placed block. It should return an object containing the id and data of the block to place.

#### serv.onBlockInteraction(name, handler)

Register a handler that will be called when a player interact with a block of type `name`.

The argument given to the handler is an object containing the clicked block and the player. It should return true if the block interaction occurred and the block placement should be cancelled.

#### serv.onBlockUpdate(name, handler)

Register a handler that will be called when a block of the type `name` is updated. It should verify that the block state is still correct according to the game's rules. It is triggered when a neighboring block has been modified.

The arguments of the handler are the world in which the update occurred, the block, fromTick the tick at which the update was triggered, the tick the update was scheduled to (current tick), and optional data (null most of the time) that can be used to transmit data between block updates. The handler should return true if the block was changed so the update manager can send a multiBlockChange packet for all the changes that occurred within the tick. The state of the block should be modified by using the world's setBlockXXX functions instead of serv.setBlock (that would send redundant updates to players).

#### serv.updateBlock(world, pos, fromTick, tick, forceNotify = false, data = null)

Trigger a block update for the block in `world` at `pos`. `fromTick` is the current server tick `serv.tickCount`, `tick` is the future server tick when the update should be executed. When `forceNotify` is true, the block update will always trigger an update on the 6 direct neighbors, even when no handler is registered for this block type. `data` is an optional object that will be given to the handler.

#### serv.notifyNeighborsOfStateChange(world, pos, fromTick, tick, forceNotify = false, data = null)

Similar to `serv.updateBlock` but will trigger an update on the 6 direct neighbors of `pos` but not on the block itself.

#### serv.notifyNeighborsOfStateChangeDirectional(world, pos, dir, fromTick, tick, forceNotify = false, data = null)

Similar to `serv.updateBlock` but will trigger an update on 5 of the direct neighbors of `pos.plus(dir)`, but not on the block at `pos` or `pos.plus(dir)`.

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

#### server.setBlock(world, position, blockType, blockData)

Saves block in world and sends block update to all players of the same world.

#### server.setBlockAction(world, position, actionId, actionParam)

Sends a block action to all players of the same world.

#### server.playSound(sound, world, position, opt)

Plays `sound` (string, google "minecraft sound list") to all players in `opt.radius`. 
If position is null, will play at the location of every player (taking into account whitelist and blacklist).

Opt:
- whitelist: Array of players that can hear the sound (can be a player object)
- blacklist: Array of players who cannot hear the sound
- radius: Radius that sound can be heard (in fixed position so remember to multiply by 32, default 32*32)
- volume: float from 0-1 (default 1.0)
- pitch: float from 0.5 to 2 (default 1.0)

#### server.playNoteBlock(world, position, pitch)

Plays noteblock in world at position. `pitch` is from 0-24

#### server.getNote(note)

Get pitch. `note` should be between 0-24 and your output is from 0.5 to 2.0

#### server.emitParticle(particle, world, position, opt)

Emits particle (see [id list](http://wiki.vg/Protocol#Particle)) at `position` in `world`.

Opt:
- whitelist: Array of players that can see the particle (can be a player object)
- blacklist: Array of players who cannot see the particle
- radius: Radius that the particle can be seen from
- longDistance: I don't know what this is. I think this is pointless with our implenetation of radius, not sure though...
- size: vec3 of the size. (0,0,0) will be at an exact position, (10,10,10) will be very spread out (particles less dense)
- count: Number of particles. 100,000,000+ will crash the client. Try not to go over 100,000 (sincerely, minecraft clients)


### Low level methods

#### server._writeAll(packetName, packetFields)

Writes packet to every player on the server

#### server._writeArray(packetName, packetFields, playerArray)

Writes packet to every player in playerArray

#### server._writeNearby(packetName, packetFields, loc)

Writes packet to all players within distance of loc. loc has the same paramater as loc in server.getNearby()

## Entity

Players are a type of entity, so they will have most of the attributes and methods

### Properties

#### entity.id

ID of entity on server

#### entity.position

Current position (currently in fixed position (x32 what you'd expect) so do entity.position.scaled(1/32) to get normal position)

#### entity.world

World object entity is in

#### entity.type

Either "player", "mob", or "object" (currently)

#### entity.entityType

Numerical type of the entity.

#### entity.name

Sub-category of entity. For mobs, this is which mob (Zombie/Skeleton, etc). For objects, this is which object (Arrow/Dropped item, etc)

#### entity.nearbyEntities

Nearby entities to this entity

#### entity.viewDistance

How far away entities are loaded/unloaded (used for players ATM)

#### entity.health

How many half-hearts an entity has of health (e.g. Player has 20). Not really used for objects, only players and mobs.

#### entity.pitch

Pitch of entity (rotation sideways)

#### entity.headPitch

Pitch of entity's head

#### entity.yaw

Yaw of entity (rotation looking up and down)

#### entity.gravity

Gravity of entity (non-players) to calculate physics.

#### entity.terminalvelocity

Only applies to gravity, really. You can still apply a velocity larger than terminal velocity.

#### entity.friction

Decreases velocity when touching blocks

#### entity.size

Used to calculate collisions for server-side entities

#### entity.deathTime

How much time before an entity despawns (in ms)

#### entity.pickupTime

How long before an entity can be picked up (in ms)

#### entity.bornTime

When an entity was born. Used with pickupTime and deathTime (time in epoch)

#### entity.itemId

If a block drop, what item id

#### entity.itemDamage

If a block drop, what item damage

#### entity.metadata

Metadata for the entity (not like block metadata/damage). Contains stuff like NBT.

#### entity.nearbyEntities

List of entities that the entity believes is nearby.

### Events



### Behaviors

Behaviors are very interesting. Let me explain to you how they work:

Behaviors are a special type of event. They are editable and allow defaults to be cancellable making the powerful 
for plugins to take control of and interact with each other. Three different events get called 
for a behavior:
- EVENTNAME_cancel
- EVENTNAME
- EVENTNAME_done

EVENTNAME_cancel passses the paramaters `data` (object of all info about behavior. Changing the data could have effects on outcome) and `cancel`, a function. This event is run before the default action. If `cancel()` is called, it will cancel the default action. More on this later.

EVENTNAME passes `data` as well as `cancelled` so plugins can check if the default behavior has been cancelled. This is event is run 
before the default action.

EVENTNAME_done passes `data` and `cancelled`. This event is run before the default action.

Example: One plugin wants to cancel a player's movement while another wants to say "HI" when they move

Plugin A:
```js
player.on('move_cancel', ({position}, cancel) => {
  cancel(); // If player tries to move, shoots them back where they came from
});
```

Plugin B:
```js
player.on('move', ({position}, cancelled) => {
  if (!cancelled) player.chat('HI!');
})
```

When a player normally moves, the server saves their position and sends it to all clients. Therefore, if a "move" behavior was truly cancelled, 
the player would be able to move freely while the server and other players would see the player stationary. This doesn't happen because 
behaviors can have "default cancel functions". In the case of a player's "move", the default cancel function sends them back where they 
came from. To prevent this from happening, use the "preventDefaultCancel" paramater: cancel(false);

Plugin C
```js
player.on('move_cancel', ({position}, cancel) => {
  cancel(false); // Doesn't teleport player back
});
```

If we keep Plugin B and replace Plugin A with Plugin C, we'll see that the player can move freely but will not receive the 
word "HI" and other players will be unable to see their movements.

Finally, there is hidden cancel. This is the second parameter in cancel, and allows plugins to hide the fact that they cancelled 
the default action from other plugins. It's best not to use this, but I know somebody will someday need this.

Plugin D
```js
player.on('move_cancel', ({position}, cancel) => {
  cancel(false, true); // Player doesn't teleport back and now "cancelled" will be false
})
```

Using Plugin B and D together, the player will be able to move freely and will be spammed with "HI", however the server will not store 
their position and other players will not see the player move.

#### FORMAT

Definition of behavior.
- var1: Variable with value, can be changed (default: defaultValue)
- var2 (u): Variable with value. You can change it however it will not have any effect on the default action (and could screw with other plugins, watch out!). U stands for unused

Default: What happens if this isn't cancelled.

Cancelled: What happens if this is cancelled and preventDefaultCancel is still false.

#### "move"

Emitted when server calculates new position for the entity (DOES NOT APPLY TO PLAYER!)
- old (u): Where the entity came from
- onGround (u): If the entity is on the ground

Default: Send entity relative-move or teleport packets to all nearby players

Cancelled: Set entity position to old position

### Methods

#### entity.getData(pluginName)

Gets object that stores data, personalized per plugin. Returns null if plugin does not exist.

Shortcut for: entity.pluginData[pluginName];

#### entity.getOthers()

Get every other entity other than self

#### entity.getOtherPlayers()

Gets every player other than self (all players if entity is not a player)

#### entity.getNearby()

Gets all entities nearby (within entity.viewDistance)

#### entity.getNearbyPlayers()

Gets all nearby players regardless of what client thinks

#### entity.nearbyPlayers()

Gets all nearby players that client can see

#### entity.takeDamage({sound='game.player.hurt', damage=1, velocity=new Vec3(0,0,0), maxVelocity=new Vec3(4, 4, 4), animation=true})

* sound: Sound to play (default is game.player.hurt)
* damage: Damage to deal (default is based off player's weapon, player's potions, attackEntity's potions, and attackedEntity armor)
* velocity: Which way should attackedEntity move when hit
* maxVelocity: maxVelocity from consecutive hits
* animation: Play death/hit animation

### Low level Methods

#### entity._writeOthers(packetName, packetFields)

Writes to all other players on server

#### entity._writeOthersNearby(packetName, packetFields)

Writes to all players within viewDistance

## Player

### Properties

#### player.username

The username of the player

#### player.view

The view size of the player, for example 8 for 16x16

#### player.xp

Total experience the player has (int). Set this using player.setXp()

#### player.displayXp

Number from 0 to 1.0 representing the progress bar at the bottom of the player's screen. Set this with player.setDisplayXp()

#### player.xpLevel

Level of xp the player has. Set this with player.setXpLevel()

### Events

#### "connected" 

Fires when the player is connected

#### "spawned"

Fires when the player is spawned

#### "disconnected"

Fires when the player disconnected

#### "chat" (message)

Fires when the player says `message`.

#### "kicked" (kicker,reason)

`kicker` kick the player with `reason`

#### "positionChanged"

fires when the position changes in small amounts (walking, running, or flying)

### Behaviors

See entity "Behaviors" for more info

#### "move"

When player tries to move
- position (u): New position player is trying to move to
- onGround (u): Whether player thinks they're on the ground or not

Default: Save position/onGround and write to all nearby players

Cancelled: Snap back to old position

#### "look"

When player tries to look somewhere
- yaw (u): New yaw player is looking
- pitch (u): New pitch player is looking
- onGround (u): If player thinks they're on the ground

Default: Save look directions, send to all nearby players

Cancelled: Snap their view back to old yaw and pitch

#### "chat"

Emitted when player tries to say something (unless they're message starts with /, then refer to "command")
- message (u): Message player sent
- broadcastMessage: What is put in server chat (Default: <username> message)

Default: Broadcasts to server their message

Cancelled: Nothing

#### "command"

Emitted when player starts their message with a slash
- command: Their commands (excludes the slash)

Default: Handle command by command system

Cancelled: Nothing

#### "punch"

When player tries to punch nothing

Default: Send punch animation to nearby players

Cancelled: Nothing

#### "sendBlock"

Emitted when sending a block to a player (block changed). This is separate for every player, cancelling this for one player causes ghost blocks!
- position: Position of the block
- id: ID of the block
- data: Metadata of the block

Default: Send block change to player.

Cancelled: Nothing

#### "sendBlockAction"

Emitted when sending a block action to a player. This is separate for every player, cancelling this for one player will prevent the action from happening.
- position: Position of the block
- id: ID of the block
- actionId: Action ID, dependent on the block.
- actionParam: The parameters depend on the block.

All block action IDs and parameters are listed [here](https://wiki.vg/Block_Actions).

Default: Send block action to player.

Cancelled: Nothing

#### "sendChunk"

Emitted when sending a chunk to a player (loading it in)
- x: Chunk X
- z: Chunk Z
- chunk: Chunk data

Default: Continue sending chunk to client

Cancelled: Nothing

#### "dig"

Emitted when any player STARTS digging (i.e. survival only)
- position: Position of block being mined
- block (u): Block being mined

Default: Allow player to start mining block, send changes in break animation to other players

Cancelled: Stop them from digging

#### "dug"

Emitted when a player finishes digging something (or a player in creative breaks a block)
- position: Position of block dug
- block (u): Block dug
- dropBlock: Should it drop a block object (Default: false in creative, otherwise true)
- blockDropPosition: Where block is dropped (Default: center of block)
- blockDropWorld: World block is dropped in (Default is the world the player/block is in)
- blockDropVelocity: The velocity the block has when dropped (Default: random)
- blockDropId: ID of the block dropped
- blockDropDamage: Damage of the block dropped
- blockDropPickup: Time before user can pick up the block (Default: 0.5 seconds)
- blockDropDeath: Time before item despawns (Default: 5 minutes)

Default: Save new block as air, sends to all nearby players

Cancelled: Send to player the block that was there

#### "cancelDig"

Emitted when a player cancels digging in the middle (i.e. survival only)
- position: Position of block that was being mined
- block (u): Block that was being mined

Default: Stop animation for all players, save stop digging

Cancelled: Nothing

#### "forceCancelDig"

Emitted when the server cancels a dig (currently only happens if the player mines too fast)
- stop: Whether the digging should be cancelled because they mined too fast (Default: true)
- start (u): Time mining started
- time (u): How long the player has been mining

##### "breakAnimation"

Emitted when the server believes the break animation should increase (not sent by client!)
- position: Position of block being updated
- state: New state being changed to
- lastState (u): Last state of block
- start (u): When mining started
- timePassed (u): How long between start and now

Default: Send animation to everyone

Cancelled: Nothing

#### "placeBlock"

Emitted when a player places a block
- position: Position they're attempting to place the block
- id: Id of block being placed
- damage: Data of block being placed
- reference (u): Reference block (position) that was placed on
- direction (u): Direction vector from reference to position
- playSound: Which sound to play (Default: true)
- sound: Sound to play (Default: default sound for that material)

Default: Place block for server and nearby players

Cancelled: Replace block with old block for player

#### "attack"

Emitted when a player attacks an entity
- attackedEntity: Entity being attacked
- playSound: Play sound (Default: true)
- sound: Sound to play (default is game.player.hurt)
- damage: Damage to deal (default is based off player's weapon, player's potions, attackEntity's potions, and attackedEntity armor)
- velocity: Which way should attackedEntity move when hit
- maxVelocity: maxVelocity from consecutive hits
- animation: Play death/hit animation

Default: Damage entity, play sound, send velocity, play animation for death/hit

Cancelled: Nothing

#### "requestRespawn"

Emitted when a player tries to respawn

Default: Let them respawn

Cancelled: Nothing. You monster.

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

#### player.changeBlock(position,blockType,blockData)

change the block at position `position` to `blockType` and `blockData`

this will not change the block for the user himself. It is mainly useful when a user places a block 
and only needs to send it to other players on the server

#### player.sendBlock(position,blockType,blockData)

change the block at position `position` to `blockType` and `blockData`

this will not make any changes on the server's world and only sends it to the user as a "fake" or "local" block

#### player.sendBlockAction(position,actionId,actionParam,blockType)

Set the block action at position `position` to `actionId` and `actionParam`.

``blockType`` is only required when the block at the location is a fake block. 
This will only be caused by using ``player.sendBlock``.

This will not make any changes to the server's world and only sends it to the user as a local action.

#### player.sendBrand(brand = 'flying-squid')

Send the specified `brand` to the player or `flying-squid` by default

#### player.sendInitialPosition()

send its initial position to the player

#### player.setGameMode(gameMode)

set player gameMode to `gameMode`

#### player.handleCommand(command)

handle `command`

#### player.setBlock(position,blockType,blockData)

Saves block in world and sends block update to all players of the same world.

#### player.setBlockAction(position,actionId,actionParam)

Sets a block action and sends the block action to all players in the same world.

This will not make any changes to the server's world

#### player.updateHealth(health)

Updates the player's health and sends the relevant packet.

#### player.updateFood(food)

Updates the player's food and sends the relevant packet.

#### player.updateFoodSaturation(foodSaturation)

Updates the player's food saturation and sends the relevant packet.

#### player.changeWorld(world, opt)

The world object which the player is in (use serv.overworld, serv.netherworld, serv.endworld, or a custom world). Options:

- gamemode: Gamemode of the world (Default is player gamemode)
- difficulty: Difficulty of world. Default is 0 (easiest)
- dimension: Dimension of world. 0 is Overworld, -1 is Nether, 1 is End (Default is 0)

#### player.spawnAPlayer(spawnedPlayer)

Spawn `spawnedPlayer` for `player`.

#### player.updateAndSpawnNearbyPlayers()

Spawn and despawn the correct players depending on distance for `player`.

#### player.playSound(sound, opt)

Easy way to only play a sound for one player. Same opt as serv.playSound except no `whitelist`.

#### player.setXp(xp, opt)

Sets the player's XP level. Options:
- setLevel: Calculate and set player.level (default: true)
- setDisplay: Calculate and set player.displayXp (default: true)
- send: Send xp packet (default: true)

#### player.sendXp()

Updates the player's xp based on player.xp, player.displayXp, and player.xpLevel

#### player.setXpLevel(level)

Sets and sends the player's new level

#### player.setDisplayXp(num)

Sets and sends the player's new display amount. num should be from 0 to 1.0

### Low level properties

#### player._client

The internal implementation to communicate with a client

### Low level methods

Same as entity