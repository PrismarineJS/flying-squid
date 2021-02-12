const Vec3 = require('vec3')

module.exports.player = function (player, serv, { version }) {
  const Item = require('prismarine-item')(version)
  const windows = require('prismarine-windows')(version)

  player.heldItemSlot = 0
  player.heldItem = new Item(256, 1)
  player.inventory = windows.createWindow(1, 'minecraft:inventory', 'inv', 36)

  player._client.on('held_item_slot', ({ slotId } = {}) => {
    player.heldItemSlot = slotId
    player.setEquipment(0, player.inventory.slots[36 + player.heldItemSlot])

    if (serv.supportFeature('allEntityEquipmentInOne')) {
      player._writeOthersNearby('entity_equipment', {
        entityId: player.id,
        equipments: [{
          slot: 0,
          item: Item.toNotch(player.heldItem)
        }]
      })
    } else {
      player._writeOthersNearby('entity_equipment', {
        entityId: player.id,
        slot: 0,
        item: Item.toNotch(player.heldItem)
      })
    }
  })

  player._client.on('window_click', function (clickInfo) {
    // Do other stuff the inventory doesn't do, eg spawn the dropped item.
    // I've left in stuff that inventory handles, because the cancelling hooks
    // might go here (?)
    switch (clickInfo.mode) {
      case 0: {
        if (clickInfo.mouseButton === 0) {
          // Left mouse click
          // Inventory deals with this
        } else {
          // Right mouse click
          // Inventory deals with this
        }
        break
      }

      case 1: {
        if (clickInfo.mouseButton === 0) {
          // Shift + Left click
          // Inventory deals with this
          return
        } else {
          // Shift + right click
          // Inventory deals with this
          return
        }
      }

      case 2: {
        // button 0 -> 8, indication hotbar switching items
        // (Nothing to do with held_item_slot)
        // DANGER! crashes because windows.js hasn't implemented it yet.
        return
      }

      case 3: {
        // Middle click
        // DANGER! crashes because windows.js hasn't implemented it yet.
        return
      }

      case 4: {
        if (clickInfo.slot === -999) {
          // Click with nothing outside window. Do nothing.
        } else {
          // I'd love to implement this, but dropped entities are not finished.
          if (clickInfo.mouseButton === 0) {
            // Drop one item at slot
            // Inventory handles removing one

            const heldItem = player.inventory.slots[36 + player.heldItemSlot]
            serv.spawnObject(2, player.world, player.position, {
              velocity: new Vec3(0, 0, 0),
              itemId: heldItem.type,
              itemDamage: heldItem.metadata,
              pickupTime: 500,
              deathTime: 60 * 5 * 100
            })
          } else {
            // Drop full stack at slot
            // Inventory handles removing the whole stack
            return
          }
        }
        break
      }

      // Inventory does not support dragging yet, so not implementing yet.
      case 5: {
        if (clickInfo.slot === -999) {
          switch (clickInfo.mouseButton) {
            case 0: {
              // Start left mouse drag
              return
            }

            case 4: {
              // Start right mouse drag
              return
            }

            case 2: {
              // End left mouse drag
              return
            }

            case 6: {
              // End right mouse drag
              return
            }
          }
        } else {
          switch (clickInfo.mouseButton) {
            case 1: {
              // Add slot for left mouse drag
              return
            }

            case 5: {
              // Add slot for right mouse drag
              return
            }
          }
        }
        break
      }

      // Inventory does not support double click yet, so not implementing yet.
      case 6: {
        // Double click
        return
      }
    }

    // Let the inventory know of the click.
    // It's important to let it know of the click later, because it destroys
    // information we need about the inventory.
    try {
      player.inventory.acceptClick(clickInfo)
    } catch (err) {
      serv.emit('error', err)
    }
  })

  player._client.on('set_creative_slot', ({ slot, item } = {}) => {
    if (item.blockId === -1) {
      player.inventory.updateSlot(slot, undefined)
      return
    }

    const newItem = Item.fromNotch(item)
    player.inventory.updateSlot(slot, newItem)
  })

  player.inventory.on('updateSlot', function (slot, oldItem, newItem) {
    const equipments = {
      5: 4,
      6: 3,
      7: 2,
      8: 1
    }
    equipments[player.heldItemSlot] = 0
    if (equipments[slot] !== undefined) {
      player.setEquipment(equipments[slot], newItem)
      if (serv.supportFeature('allEntityEquipmentInOne')) {
        player._writeOthersNearby('entity_equipment', {
          entityId: player.id,
          equipments: [{
            slot: equipments[slot],
            item: Item.toNotch(newItem)
          }]
        })
      } else {
        player._writeOthersNearby('entity_equipment', {
          entityId: player.id,
          slot: equipments[slot],
          item: Item.toNotch(newItem)
        })
      }
    }

    player._client.write('set_slot', {
      windowId: 0,
      slot: slot,
      item: Item.toNotch(newItem)
    })
  })

  player.collect = (collectEntity) => {
    // Add it to a stack already in the player's inventory if possible
    for (let slot = 0; slot < player.inventory.slots.length; slot++) {
      const item = player.inventory.slots[slot]
      if (item && item.type === collectEntity.itemId) {
        item.count += 1
        player.inventory.updateSlot(slot, item)
        collectEntity._writeOthersNearby('collect', {
          collectedEntityId: collectEntity.id,
          collectorEntityId: player.id
        })
        player.playSoundAtSelf('random.pop')
        collectEntity.destroy()
        return
      }
    }

    // If we couldn't add it to a already existing stack, put it in a new stack if the inventory has room
    const emptySlot = player.inventory.firstEmptyInventorySlot()
    if (emptySlot) {
      collectEntity._writeOthersNearby('collect', {
        collectedEntityId: collectEntity.id,
        collectorEntityId: player.id
      })
      player.playSoundAtSelf('random.pop')

      const newItem = new Item(collectEntity.itemId, 1, collectEntity.damage)
      player.inventory.updateSlot(emptySlot, newItem)
      collectEntity.destroy()
    }
  }
}
