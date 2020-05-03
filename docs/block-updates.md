### Block placement customization

Some blocks have a different id than the item they are spawned from or have a metadata dependent on the placement context. These blocks can be customized by registering an itemPlace handler on the held item type (one handler per item type). For instance, the plugin that customize the signs placement:
```javascript
module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)

  const oakSignType = mcData.blocksByName.standing_sign.id
  const oakWallSignType = mcData.blocksByName.wall_sign.id

  serv.on('asap', () => {
    serv.onItemPlace('sign', ({ item, direction, angle }) => {
      if (direction === 1) {
        return { id: oakSignType, data: Math.floor(angle / 22.5 + 0.5) & 0xF }
      }
      return { id: oakWallSignType, data: direction }
    })
  })
}
```
The argument given to the handler is an object containing the held item that triggered the event, the direction (face) on which the player clicked, the angle of the player around the placed block. It should return an object containing the id and data of the block to place.

### Block interaction

This handler is called when a player interact with a block.
```javascript
module.exports.server = (serv, { version }) => {
  serv.on('asap', () => {
    const repeaterInteraction = async ({ block, player }) => {
      const data = (block.metadata + 4) & 0xF
      player.setBlock(block.position, block.type, data)
      return true
    }
    serv.onBlockInteraction('powered_repeater', repeaterInteraction)
    serv.onBlockInteraction('unpowered_repeater', repeaterInteraction)
  }
}
```
The argument given to the handler is an object containing the clicked block and the player. It should return true if the block interaction occurred and the block placement should be cancelled.

### Block update

This handler is called when a block of the given type is updated. It should verify that the block state is still correct according to the game's rules. It is triggered when a neighboring block has been modified.
```javascript
module.exports.server = (serv, { version }) => {
  serv.on('asap', () => {
    serv.onBlockUpdate('redstone_wire', async (world, block, fromTick, tick, data) => {
      const pos = block.position

      // Redstone wire should be on a solid block
      const support = await world.getBlock(pos.offset(0, -1, 0))
      if (support.boundingBox !== 'block') {
        await world.setBlockStateId(pos, 0)
        serv.notifyNeighborsOfStateChange(world, pos, tick, tick)
        return true
      }
      // ... rest of redstone logic
      return changed
    })
  }
}
```
The arguments of the handler are the world in which the update occurred, the block, fromTick the tick at which the update was triggered, the tick the update was scheduled to (current tick), and optional data (null most of the time) that can be used to transmit data between block updates. The handler should return true if the block was changed so the update manager can send a multiBlockChange packet for all the changes that occurred within the tick. The state of the block should be modified by using the world's setBlockXXX functions instead of serv.setBlock (that would send redundant updates to players).
