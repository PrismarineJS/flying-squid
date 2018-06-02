# Player

See `Entity` class to see what other attributes players have (such as world, position, etc)

## Properties

### player.username

The username of the player

### player.view

The view size of the player, for example 8 for 16x16

### player.xp

Total experience the player has (int). Set this using player.setXp()

### player.displayXp

Number from 0 to 1.0 representing the progress bar at the bottom of the player's screen. Set this with player.setDisplayXp()

### player.xpLevel

Level of xp the player has. Set this with player.setXpLevel()

### player.commands

Instance of the [Command](#flying-squidcommand) class.
Here is an example to create a new command :
```js
player.commands.add({
    base: 'hello',
    info: 'print hello in the console',
    usage: '/hello <pseudo>',
    op: false,
    parse(str)  {
      const args=str.split(' ');
      if(args.length!=1)
        return false;
       
      return {pseudo:args[0]};
    },
    action({pseudo}) {
      console.log("Hello "+pseudo);
    }
});
```

## Events

### "connected" 

Fires when the player is connected

### "spawned"

Fires when the player is spawned

### "disconnected"

Fires when the player disconnected

### "chat" (message)

Fires when the player says `message`.

### "kicked" (kicker,reason)

`kicker` kick the player with `reason`

### "positionChanged"

fires when the position changes in small amounts (walking, running, or flying)

## Behaviors

See entity "Behaviors" for more info

### "move"

When player tries to move
- position (u): New position player is trying to move to
- onGround (u): Whether player thinks they're on the ground or not

Default: Save position/onGround and write to all nearby players

Cancelled: Snap back to old position

### "look"

When player tries to look somewhere
- yaw (u): New yaw player is looking
- pitch (u): New pitch player is looking
- onGround (u): If player thinks they're on the ground

Default: Save look directions, send to all nearby players

Cancelled: Snap their view back to old yaw and pitch

### "chat"

Emitted when player tries to say something (unless they're message starts with /, then refer to "command")
- message (u): Message player sent
- broadcastMessage: What is put in server chat (Default: <username> message)

Default: Broadcasts to server their message

Cancelled: Nothing

### "command"

Emitted when player starts their message with a slash
- command: Their commands (excludes the slash)

Default: Handle command by command system

Cancelled: Nothing

### "punch"

When player tries to punch nothing

Default: Send punch animation to nearby players

Cancelled: Nothing

### "sendBlock"

Emitted when sending a block to a player (block changed). This is separate for every player, cancelling this for one player causes ghost blocks!
- position: Position of the block
- id: ID of the block
- data: Metadata of the block

Default: Send block change to player.

Cancelled: Nothing

### "sendChunk"

Emitted when sending a chunk to a player (loading it in)
- x: Chunk X
- z: Chunk Z
- chunk: Chunk data

Default: Continue sending chunk to client

Cancelled: Nothing

### "dig"

Emitted when any player STARTS digging (i.e. survival only)
- position: Position of block being mined
- block (u): Block being mined

Default: Allow player to start mining block, send changes in break animation to other players

Cancelled: Stop them from digging

### "dug"

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

### "cancelDig"

Emitted when a player cancels digging in the middle (i.e. survival only)
- position: Position of block that was being mined
- block (u): Block that was being mined

Default: Stop animation for all players, save stop digging

Cancelled: Nothing

### "forceCancelDig"

Emitted when the server cancels a dig (currently only happens if the player mines too fast)
- stop: Whether the digging should be cancelled because they mined too fast (Default: true)
- start (u): Time mining started
- time (u): How long the player has been mining

#### "breakAnimation"

Emitted when the server believes the break animation should increase (not sent by client!)
- position: Position of block being updated
- state: New state being changed to
- lastState (u): Last state of block
- start (u): When mining started
- timePassed (u): How long between start and now

Default: Send animation to everyone

Cancelled: Nothing

### "placeBlock"

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

### "attack"

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

### "requestRespawn"

Emitted when a player tries to respawn

Default: Let them respawn

Cancelled: Nothing. You monster.

## Methods

### player.login()

login

### player.ban(reason)

bans player with `reason`

### player.kick(reason)

kicks player with `reason`

### player.getOthers()

return the other players than `player`

### player.chat(message)

sends `message` to the player

### player.changeBlock(position,blockType,blockData)

change the block at position `position` to `blockType` and `blockData`

this will not change the block for the user himself. It is mainly useful when a user places a block 
and only needs to send it to other players on the server

### player.sendBlock(position,blockType,blockData)

change the block at position `position` to `blockType` and `blockData`

this will not make any changes on the server's world and only sends it to the user as a "fake" or "local" block

### player.sendInitialPosition()

send its initial position to the player

### player.setGameMode(gameMode)

set player gameMode to `gameMode`

### player.handleCommand(command)

handle `command`

### player.setBlock(position,blockType,blockData)

Saves block in world and sends block update to all players of the same world.

### player.updateHealth(health)

update the player health.

### player.changeWorld(world, opt)

The world object which the player is in (use serv.overworld, serv.netherworld, serv.endworld, or a custom world). Options:

- gamemode: Gamemode of the world (Default is player gamemode)
- difficulty: Difficulty of world. Default is 0 (easiest)
- dimension: Dimension of world. 0 is Overworld, -1 is Nether, 1 is End (Default is 0)

### player.spawnAPlayer(spawnedPlayer)

Spawn `spawnedPlayer` for `player`.

### player.updateAndSpawnNearbyPlayers()

Spawn and despawn the correct players depending on distance for `player`.

### player.playSound(sound, opt)

Easy way to only play a sound for one player. Same opt as serv.playSound except no `whitelist`.

### player.setXp(xp, opt)

Sets the player's XP level. Options:
- setLevel: Calculate and set player.level (default: true)
- setDisplay: Calculate and set player.displayXp (default: true)
- send: Send xp packet (default: true)

### player.sendXp()

Updates the player's xp based on player.xp, player.displayXp, and player.xpLevel

### player.setXpLevel(level)

Sets and sends the player's new level

### player.setDisplayXp(num)

Sets and sends the player's new display amount. num should be from 0 to 1.0

## Low level properties

### player._client

The internal implementation to communicate with a client

## Low level methods

Same as entity
