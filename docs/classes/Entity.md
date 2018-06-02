# Entity

Is a [prismarine-entity](https://github.com/PrismarineJS/prismarine-entity)

Players are a type of entity, so they will have most of the attributes and methods.

## Properties

### entity.id

ID of entity on server

### entity.position

Current position (currently in fixed position (x32 what you'd expect) so do entity.position.scaled(1/32) to get normal position)

### entity.world

World object entity is in

### entity.type

Either "player", "mob", or "object" (currently)

### entity.entityType

Numerical type of the entity.

### entity.name

Sub-category of entity. For mobs, this is which mob (Zombie/Skeleton, etc). For objects, this is which object (Arrow/Dropped item, etc)

### entity.nearbyEntities

Nearby entities to this entity

### entity.viewDistance

How far away entities are loaded/unloaded (used for players ATM)

### entity.health

How many half-hearts an entity has of health (e.g. Player has 20). Not really used for objects, only players and mobs.

### entity.pitch

Pitch of entity (rotation sideways)

### entity.headPitch

Pitch of entity's head

### entity.yaw

Yaw of entity (rotation looking up and down)

### entity.gravity

Gravity of entity (non-players) to calculate physics.

### entity.terminalvelocity

Only applies to gravity, really. You can still apply a velocity larger than terminal velocity.

### entity.friction

Decreases velocity when touching blocks

### entity.size

Used to calculate collisions for server-side entities

### entity.deathTime

How much time before an entity despawns (in ms)

### entity.pickupTime

How long before an entity can be picked up (in ms)

### entity.bornTime

When an entity was born. Used with pickupTime and deathTime (time in epoch)

### entity.itemId

If a block drop, what item id

### entity.itemDamage

If a block drop, what item damage

### entity.metadata

Metadata for the entity (not like block metadata/damage). Contains stuff like NBT.

### entity.nearbyEntities

List of entities that the entity believes is nearby.

## Events



## Behaviors

### "move"

Emitted when server calculates new position for the entity (DOES NOT APPLY TO PLAYER!)
- old (u): Where the entity came from
- onGround (u): If the entity is on the ground

Default: Send entity relative-move or teleport packets to all nearby players

Cancelled: Set entity position to old position

## Methods

### entity.getData(pluginName)

Gets object that stores data, personalized per plugin. Returns null if plugin does not exist.

Shortcut for: entity.pluginData[pluginName];

### entity.getOthers()

Get every other entity other than self

### entity.getOtherPlayers()

Gets every player other than self (all players if entity is not a player)

### entity.getNearby()

Gets all entities nearby (within entity.viewDistance)

### entity.getNearbyPlayers()

Gets all nearby players regardless of what client thinks

### entity.nearbyPlayers()

Gets all nearby players that client can see

### entity.takeDamage({sound='game.player.hurt', damage=1, velocity=new Vec3(0,0,0), maxVelocity=new Vec3(4, 4, 4), animation=true})

* sound: Sound to play (default is game.player.hurt)
* damage: Damage to deal (default is based off player's weapon, player's potions, attackEntity's potions, and attackedEntity armor)
* velocity: Which way should attackedEntity move when hit
* maxVelocity: maxVelocity from consecutive hits
* animation: Play death/hit animation

## Low level Methods

### entity._writeOthers(packetName, packetFields)

Writes to all other players on server

### entity._writeOthersNearby(packetName, packetFields)

Writes to all players within viewDistance