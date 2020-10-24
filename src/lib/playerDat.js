/* global BigInt */

const fs = require('fs')
const Vec3 = require('vec3').Vec3
const nbt = require('prismarine-nbt')
const long = require('long')
const { gzip } = require('node-gzip')
const { promisify } = require('util')
const convertInventorySlotId = require('./convertInventorySlotId')

const nbtParse = promisify(nbt.parse)

module.exports = { read, save }

const defaultPlayer = {
  health: 20,
  food: 20,
  heldItemSlot: 0
}

async function read (uuid, spawnPoint, worldFolder) {
  try {
    const playerDataFile = await fs.promises.readFile(`${worldFolder}/playerdata/${uuid}.dat`)
    const playerData = (await nbtParse(playerDataFile)).value
    return {
      player: {
        health: playerData.Health.value,
        food: playerData.foodLevel.value,
        gameMode: playerData.playerGameType.value,
        xp: playerData.XpTotal.value,
        heldItemSlot: playerData.SelectedItemSlot.value,
        position: new Vec3(playerData.Pos.value.value[0], playerData.Pos.value.value[1], playerData.Pos.value.value[2]),
        yaw: playerData.Rotation.value.value[0],
        pitch: playerData.Rotation.value.value[1],
        onGround: Boolean(playerData.OnGround.value)
      },
      inventory: playerData.Inventory.value.value
    }
  } catch (e) {
    return {
      player: { ...defaultPlayer, ...{ position: spawnPoint.clone() } },
      inventory: []
    }
  }
}

async function save (player, worldFolder, snakeCase) {
  function playerInventoryToNBT (playerInventory) {
    const nbtInventory = []
    playerInventory.slots.forEach(item => {
      if (item) {
        nbtInventory.push({
          Slot: {
            type: 'byte',
            value: convertInventorySlotId.toNBT(item.slot)
          },
          id: {
            type: 'string',
            value: `minecraft:${item.name}`
          },
          Count: {
            type: 'byte',
            value: item.count
          },
          Damage: {
            type: 'short',
            value: item.metadata
          }
        })
      }
    })
    return nbtInventory
  }

  if (worldFolder !== undefined) {
    try {
      const playerDataFile = await fs.promises.readFile(`${worldFolder}/playerdata/${player.uuid}.dat`)
      const newUncompressedData = await nbtParse(playerDataFile)

      newUncompressedData.value.Health.value = player.health
      newUncompressedData.value.foodLevel.value = player.food
      newUncompressedData.value.playerGameType.value = player.gameMode
      newUncompressedData.value.XpTotal.value = player.xp
      newUncompressedData.value.SelectedItemSlot.value = player.heldItemSlot
      newUncompressedData.value.Pos.value.value = [player.position.x, player.position.y, player.position.z]
      newUncompressedData.value.Rotation.value.value = [player.yaw, player.pitch]
      newUncompressedData.value.OnGround.value = Number(player.onGround)
      newUncompressedData.value.Inventory.value.value = playerInventoryToNBT(player.inventory)

      const newDataCompressed = await gzip(nbt.writeUncompressed(newUncompressedData))
      fs.writeFileSync(`${worldFolder}/playerdata/${player.uuid}.dat`, newDataCompressed)
    } catch (e) {
      // Get UUIDMost & UUIDLeast. mc-uuid-converter Copyright (c) 2020 Sol Toder https://github.com/AjaxGb/mc-uuid-converter under MIT License.
      const uuidBytes = new Uint8Array(16)
      const uuid = new DataView(uuidBytes.buffer)

      const hexText = player.uuid.includes('-')
        ? player.uuid.trim()
            .split('-')
            .map((g, i) => g.padStart([8, 4, 4, 4, 12][i], '0'))
            .join('')
        : player.uuid.trim().padStart(32, '0')
      uuid.setBigUint64(0, BigInt('0x' + hexText.substring(0, 16)), false)
      uuid.setBigUint64(8, BigInt('0x' + hexText.substring(16)), false)

      const UUIDMostLong = long.fromString(uuid.getBigInt64(0, false).toString(), false)
      const UUIDLeastLong = long.fromString(uuid.getBigInt64(8, false).toString(), false)

      const newUncompressedData = {
        type: 'compound',
        name: '',
        value: {
          HurtByTimestamp: {
            type: 'int',
            value: 0
          },
          SleepTimer: {
            type: 'short',
            value: 0
          },
          Attributes: {
            type: 'list',
            value: {
              type: 'compound',
              value: [
                {
                  Base: {
                    type: 'double',
                    value: 20
                  },
                  Name: {
                    type: 'string',
                    value: snakeCase ? 'generic.max_health' : 'generic.maxHealth'
                  }
                },
                {
                  Base: {
                    type: 'double',
                    value: 0
                  },
                  Name: {
                    type: 'string',
                    value: snakeCase ? 'generic.knockback_resistance' : 'generic.knockbackResistance'
                  }
                },
                {
                  Base: {
                    type: 'double',
                    value: 0.10000000149011612
                  },
                  Name: {
                    type: 'string',
                    value: snakeCase ? 'generic.movement_speed' : 'generic.movementSpeed'
                  }
                },
                {
                  Base: {
                    type: 'double',
                    value: 0
                  },
                  Name: {
                    type: 'string',
                    value: 'generic.armor'
                  }
                },
                {
                  Base: {
                    type: 'double',
                    value: 0
                  },
                  Name: {
                    type: 'string',
                    value: snakeCase ? 'generic.armor_toughness' : 'generic.armorToughness'
                  }
                },
                {
                  Base: {
                    type: 'double',
                    value: 1
                  },
                  Name: {
                    type: 'string',
                    value: snakeCase ? 'generic.attack_damage' : 'generic.attackDamage'
                  }
                },
                {
                  Base: {
                    type: 'double',
                    value: 4
                  },
                  Name: {
                    type: 'string',
                    value: snakeCase ? 'generic.attack_speed' : 'generic.attackSpeed'
                  }
                },
                {
                  Base: {
                    type: 'double',
                    value: 0
                  },
                  Name: {
                    type: 'string',
                    value: 'generic.luck'
                  }
                }
              ]
            }
          },
          Invulnerable: {
            type: 'byte',
            value: 0
          },
          FallFlying: {
            type: 'byte',
            value: 0
          },
          PortalCooldown: {
            type: 'int',
            value: 0
          },
          AbsorptionAmount: {
            type: 'float',
            value: 0
          },
          abilities: {
            type: 'compound',
            value: {
              invulnerable: {
                type: 'byte',
                value: 0
              },
              mayfly: {
                type: 'byte',
                value: 0
              },
              instabuild: {
                type: 'byte',
                value: 0
              },
              walkSpeed: {
                type: 'float',
                value: 0.10000000149011612
              },
              mayBuild: {
                type: 'byte',
                value: 1
              },
              flying: {
                type: 'byte',
                value: 0
              },
              flySpeed: {
                type: 'float',
                value: 0.05000000074505806
              }
            }
          },
          FallDistance: {
            type: 'float',
            value: 0
          },
          recipeBook: {
            type: 'compound',
            value: {
              recipes: {
                type: 'list',
                value: {
                  type: 'end',
                  value: []
                }
              },
              isFilteringCraftable: {
                type: 'byte',
                value: 0
              },
              toBeDisplayed: {
                type: 'list',
                value: {
                  type: 'end',
                  value: []
                }
              },
              isGuiOpen: {
                type: 'byte',
                value: 0
              }
            }
          },
          DeathTime: {
            type: 'short',
            value: 0
          },
          XpSeed: {
            type: 'int',
            value: 0
          },
          XpTotal: {
            type: 'int',
            value: player.xp
          },
          playerGameType: {
            type: 'int',
            value: player.gameMode
          },
          seenCredits: {
            type: 'byte',
            value: 0
          },
          Motion: {
            type: 'list',
            value: {
              type: 'double',
              value: [
                0,
                -0.0784000015258789,
                0
              ]
            }
          },
          UUIDLeast: {
            type: 'long',
            value: [
              UUIDLeastLong.high,
              UUIDLeastLong.low
            ]
          },
          Health: {
            type: 'float',
            value: player.health
          },
          foodSaturationLevel: {
            type: 'float',
            value: 5
          },
          Air: {
            type: 'short',
            value: 300
          },
          OnGround: {
            type: 'byte',
            value: Number(player.onGround)
          },
          Dimension: {
            type: 'int',
            value: 0
          },
          Rotation: {
            type: 'list',
            value: {
              type: 'float',
              value: [
                player.yaw,
                player.pitch
              ]
            }
          },
          XpLevel: {
            type: 'int',
            value: 0
          },
          Score: {
            type: 'int',
            value: 0
          },
          UUIDMost: {
            type: 'long',
            value: [
              UUIDMostLong.high,
              UUIDMostLong.low
            ]
          },
          Sleeping: {
            type: 'byte',
            value: 0
          },
          Pos: {
            type: 'list',
            value: {
              type: 'double',
              value: [
                player.position.x,
                player.position.y,
                player.position.z
              ]
            }
          },
          Fire: {
            type: 'short',
            value: -20
          },
          XpP: {
            type: 'float',
            value: 0
          },
          EnderItems: {
            type: 'list',
            value: {
              type: 'end',
              value: []
            }
          },
          DataVersion: {
            type: 'int',
            value: 1343
          },
          foodLevel: {
            type: 'int',
            value: player.food
          },
          foodExhaustionLevel: {
            type: 'float',
            value: 0
          },
          HurtTime: {
            type: 'short',
            value: 0
          },
          SelectedItemSlot: {
            type: 'int',
            value: player.heldItemSlot
          },
          Inventory: {
            type: 'list',
            value: {
              type: 'compound',
              value: playerInventoryToNBT(player.inventory)
            }
          },
          foodTickTimer: {
            type: 'int',
            value: 0
          }
        }
      }

      const newDataCompressed = await gzip(nbt.writeUncompressed(newUncompressedData))
      await fs.promises.mkdir(`${worldFolder}/playerdata/`, { recursive: true })
      fs.writeFileSync(`${worldFolder}/playerdata/${player.uuid}.dat`, newDataCompressed)
    }
  }
}
