<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [API](#api)
  - [Classes](#classes)
    - [CraftyJS.Entity](#craftyjsentity)
      - [entity.id](#entityid)
      - [entity.type](#entitytype)
      - [entity.username](#entityusername)
      - [entity.mobType](#entitymobtype)
      - [entity.displayName](#entitydisplayname)
      - [entity.entityType](#entityentitytype)
      - [entity.kind](#entitykind)
      - [entity.name](#entityname)
      - [entity.objectType](#entityobjecttype)
      - [entity.count](#entitycount)
      - [entity.position](#entityposition)
      - [entity.velocity](#entityvelocity)
      - [entity.yaw](#entityyaw)
      - [entity.pitch](#entitypitch)
      - [entity.height](#entityheight)
      - [entity.onGround](#entityonground)
      - [entity.equipment[5]](#entityequipment5)
      - [entity.heldItem](#entityhelditem)
      - [entity.metadata](#entitymetadata)
  - [MCServer](#mcserver)
    - [CraftyJS.createMCServer(options)](#craftyjscreatemcserveroptions)
    - [Properties](#properties)
      - [serv.entityMaxId](#serventitymaxid)
      - [serv.players](#servplayers)
      - [serv.uuidToPlayer](#servuuidtoplayer)
      - [serv.world](#servworld)
    - [Methods](#methods)
      - [serv.createLog()](#servcreatelog)
      - [serv.log(message)](#servlogmessage)
  - [Player](#player)
    - [Properties](#properties-1)
      - [player.entity](#playerentity)
    - [Methods](#methods-1)
      - [player.login()](#playerlogin)
    - [player.others(client)](#playerothersclient)
    - [Low level properties](#low-level-properties)
      - [player._client](#player_client)
    - [Low level methods](#low-level-methods)
    - [player._writeOthers(packetName, packetFields)](#player_writeotherspacketname-packetfields)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# API

## Classes

### CraftyJS.Entity

Entities represent players, mobs, and objects. They are emitted
in many events, and you can access your own entity with `bot.entity`.

#### entity.id

#### entity.type

Choices:

 * `player`
 * `mob`
 * `object`
 * `global` - lightning
 * `orb` - experience orb.
 * `other` - introduced with a recent Minecraft update and not yet recognized or used by a third-party mod

#### entity.username

If the entity type is `player`, this field will be set.

#### entity.mobType

If the entity type is `mob`, this field will be set.

#### entity.displayName

Field set for mob and object. A long name in multiple words.

#### entity.entityType

Field set for mob and object. The numerical type of the entity (1,2,...)

#### entity.kind

Field set for mob and object. The kind of entity (for example Hostile mobs, Passive mobs, NPCs).

#### entity.name

Field set for mob and object. A short name for the entity.

#### entity.objectType

If the entity type is `object`, this field will be set.

#### entity.count

If the entity type is `orb`, this field will be how much experience you
get from collecting the orb.

#### entity.position

#### entity.velocity

#### entity.yaw

#### entity.pitch

#### entity.height

#### entity.onGround

#### entity.equipment[5]

 * `0` - held item
 * `1` - shoes
 * `2` - legging
 * `3` - torso
 * `4` - head
 

#### entity.heldItem

Equivalent to `entity.equipment[0]`.

#### entity.metadata

See http://wiki.vg/Entities#Entity_Metadata_Format for more details.

## MCServer

### CraftyJS.createMCServer(options)

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

### Methods

#### serv.createLog()

create the log file

#### serv.log(message)

logs a `message`


## Player

### Properties

#### player.entity

The entity of the player, of type `CraftyJS.Entity`


### Methods

#### player.login()

login

### player.others(client)

return the other players than `player`

### Low level properties

#### player._client

The internal implementation to communicate with a client

### Low level methods

### player._writeOthers(packetName, packetFields)

write to other players than `player` the packet `packetName` with fields `packetFields`