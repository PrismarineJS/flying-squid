const version = require("flying-squid").version;
const entitiesByName=require("minecraft-data")(version).entitiesByName;
const mobsById=require("minecraft-data")(version).mobs;
const objectsById=require("minecraft-data")(version).objects;
const Entity = require("prismarine-entity");
const path = require('path');
const requireIndex = require('requireindex');
const plugins = requireIndex(path.join(__dirname,'..', 'plugins'));
const Item = require("prismarine-item")(version);
const UserError = require('flying-squid').UserError;

const Vec3 = require("vec3").Vec3;

module.exports.server=function(serv,options) {
  serv.initEntity = (type, entityType, world, position) => {
    serv.entityMaxId++;
    const entity = new Entity(serv.entityMaxId);

    Object.keys(plugins)
      .filter(pluginName => plugins[pluginName].entity!=undefined)
      .forEach(pluginName => plugins[pluginName].entity(entity, serv, options));

    entity.initEntity(type, entityType, world, position);

    serv.emit("newEntity",entity);

    return entity;
  };

  serv.spawnObject = (type, world, position, {pitch=0,yaw=0,velocity=new Vec3(0,0,0),data=1,itemId,itemDamage=0,pickupTime=undefined,deathTime=undefined}) => {
    const object = serv.initEntity('object', type, world, position.scaled(32).floored());
    object.name=objectsById[type].name;
    object.data = data;
    object.velocity = velocity.scaled(32).floored();
    object.pitch = pitch;
    object.yaw = yaw;
    object.gravity = new Vec3(0, -20*32, 0);
    object.terminalvelocity = new Vec3(27*32, 27*32, 27*32);
    object.friction = new Vec3(15*32, 0, 15*32);
    object.size = new Vec3(0.25*32, 0.25*32, 0.25*32); // Hardcoded, will be dependent on type!
    object.deathTime = deathTime;
    object.pickupTime = pickupTime;
    object.itemId = itemId;
    object.itemDamage = itemDamage;

    object.updateAndSpawn();
  };

  serv.spawnMob = (type, world, position, {pitch=0,yaw=0,headPitch=0,velocity=new Vec3(0,0,0),metadata=[]}={}) => {
    const mob = serv.initEntity('mob', type, world, position.scaled(32).floored());
    mob.name=mobsById[type].name;
    mob.velocity = velocity.scaled(32).floored();
    mob.pitch = pitch;
    mob.headPitch = headPitch;
    mob.yaw = yaw;
    mob.gravity = new Vec3(0, -20*32, 0);
    mob.terminalvelocity = new Vec3(27*32, 27*32, 27*32);
    mob.friction = new Vec3(15*32, 0, 15*32);
    mob.size = new Vec3(0.75, 1.75, 0.75);
    mob.health = 20;
    mob.metadata = metadata;

    mob.updateAndSpawn();
    return mob;
  };

  serv.destroyEntity = entity => {
    entity._writeOthersNearby('entity_destroy', {
      entityIds: [entity.id]
    });
    delete serv.entities[entity.id];
  };
};


module.exports.player=function(player,serv){
  player.commands.add({
    base: 'summon',
    info: 'Summon an entity',
    usage: '/summon <entity_name>',
    op: true,
    action(name) {
      const entity=entitiesByName[name];
      if(!entity) {
        player.chat("No entity named "+name);
        return;
      }
      if(entity.type=="mob") serv.spawnMob(entity.id, player.world, player.position.scaled(1/32), {
        velocity: Vec3((Math.random() - 0.5) * 10, Math.random()*10 + 10, (Math.random() - 0.5) * 10)
      });
      else if(entity.type=="object") serv.spawnObject(entity.id, player.world, player.position.scaled(1/32), {
        velocity: Vec3((Math.random() - 0.5) * 10, Math.random()*10 + 10, (Math.random() - 0.5) * 10)
      });
    }
  });

  player.commands.add({
    base: 'summonMany',
    info: 'Summon many entities',
    usage: '/summonMany <number> <entity_name>',
    op: true,
    parse(str) {
      var args=str.split(" ");
      if(args.length!=2)
        return false;
      return {count:args[0],name:args[1]};
    },
    action({count,name}) {
      const entity=entitiesByName[name];
      if(!entity) {
        player.chat("No entity named "+name);
        return;
      }
      if(count>(options["mob-spawn"]||10)){
        player.chat(`Maximum count to spawn is ${options["mob-spawn"]||10}!`);
        return;
      }
      let s=Math.floor(Math.sqrt(count));
      for(let i=0;i<count;i++) {
        if(entity.type=="mob")
          serv.spawnMob(entity.id, player.world, player.position.scaled(1 / 32).offset(Math.floor(i / s * 10), 0, i % s * 10), {
          velocity: Vec3((Math.random() - 0.5) * 10, Math.random() * 10 + 10, (Math.random() - 0.5) * 10)
        });
        else if(entity.type=="object")
          serv.spawnObject(entity.id, player.world, player.position.scaled(1 / 32).offset(Math.floor(i / s * 10), 0, i % s * 10), {
          velocity: Vec3((Math.random() - 0.5) * 10, Math.random() * 10 + 10, (Math.random() - 0.5) * 10)
        });
      }
    }
  });

  player.commands.add({
    base: 'pile',
    info: 'make a pile of entities',
    usage: '/pile <entities types>',
    op: true,
    parse(str)  {
      const args=str.split(' ');
      if(args.length==0)
        return false;
      return args
        .map(name => entitiesByName[name])
        .filter(entity => !!entity);
    },
    action(entityTypes) {
      entityTypes.map(entity => {
        if(entity.type=="mob") serv.spawnMob(entity.id, player.world, player.position.scaled(1/32), {
          velocity: Vec3((Math.random() - 0.5) * 10, Math.random()*10 + 10, (Math.random() - 0.5) * 10)
        });
        else if(entity.type=="object") serv.spawnObject(entity.id, player.world, player.position.scaled(1/32), {
          velocity: Vec3((Math.random() - 0.5) * 10, Math.random()*10 + 10, (Math.random() - 0.5) * 10)
        });
      })
        .reduce((prec,entity) => {
          if(prec!=null)
            prec.attach(entity);
          return entity;
        },null);
    }
  });

  player.commands.add({
    base: 'attach',
    info: 'attach an entity on an other entity',
    usage: '/attach <carrier> <attached>',
    op: true,
    parse(str)  {
      const args=str.split(' ');
      if(args.length!=2)
        return false;

      let carrier = player.selectorString(args[0]);
      if(carrier.length==0) throw new UserError("one carrier");
      let attached = player.selectorString(args[1]);
      if(attached.length==0) throw new UserError("one attached");

      return {carrier:carrier[0],attached:attached[0]};
    },
    action({carrier,attached}) {
      carrier.attach(attached);
    }
  });


  player.spawnEntity = entity => {
    player._client.write(entity.spawnPacketName, entity.getSpawnPacket());
    if (typeof entity.itemId != 'undefined') {
      entity.sendMetadata([{
        "key": 10,
        "type": 5,
        "value": {
          blockId: entity.itemId,
          itemDamage: entity.itemDamage,
          itemCount:1
        }
      }]);
    }
    entity.equipment.forEach((equipment,slot) => {
        if (equipment != undefined) player._client.write("entity_equipment", {
          entityId: entity.id,
          slot: slot,
          item: Item.toNotch(equipment)
        });
      }
    )
  };
};

module.exports.entity=function(entity,serv) {
  entity.initEntity=(type, entityType, world, position)=>{
    entity.type = type;
    entity.spawnPacketName = '';
    entity.entityType = entityType;
    entity.world = world;
    entity.position = position;
    entity.lastPositionPlayersUpdated = entity.position.clone();
    entity.nearbyEntities = [];
    entity.viewDistance = 150;
    entity.score = {};

    entity.bornTime = Date.now();
    serv.entities[entity.id] = entity;

    if (entity.type == 'player') entity.spawnPacketName = 'named_entity_spawn';
    else if (entity.type == 'object') entity.spawnPacketName = 'spawn_entity';
    else if (entity.type == 'mob') entity.spawnPacketName = 'spawn_entity_living';
  };

  entity.getSpawnPacket = () => {
    const scaledVelocity = entity.velocity.scaled(8000/32/20).floored(); // from fixed-position/second to unit => 1/8000 blocks per tick
    if (entity.type == 'player') {
      return {
        entityId: entity.id,
        playerUUID: entity._client.uuid,
        x: entity.position.x,
        y: entity.position.y,
        z: entity.position.z,
        yaw: entity.yaw,
        pitch: entity.pitch,
        currentItem: 0,
        metadata: entity.metadata
      }
    } else if (entity.type == 'object') {
      return {
        entityId: entity.id,
        type: entity.entityType,
        x: entity.position.x,
        y: entity.position.y,
        z: entity.position.z,
        pitch: entity.pitch,
        yaw: entity.yaw,
        objectData: {
          intField: entity.data,
          velocityX: scaledVelocity.x,
          velocityY: scaledVelocity.y,
          velocityZ: scaledVelocity.z
        }
      }
    } else if (entity.type == 'mob') {
      return {
        entityId: entity.id,
        type: entity.entityType,
        x: entity.position.x,
        y: entity.position.y,
        z: entity.position.z,
        yaw: entity.yaw,
        pitch: entity.pitch,
        headPitch: entity.headPitch,
        velocityX: scaledVelocity.x,
        velocityY: scaledVelocity.y,
        velocityZ: scaledVelocity.z,
        metadata: entity.metadata
      }
    }
  };



  entity.updateAndSpawn = () => {
    const updatedEntities=entity.getNearby();
    const entitiesToAdd=updatedEntities.filter(e => entity.nearbyEntities.indexOf(e)==-1);
    const entitiesToRemove=entity.nearbyEntities.filter(e => updatedEntities.indexOf(e)==-1);
    if (entity.type == 'player') {
      entity.despawnEntities(entitiesToRemove);
      entitiesToAdd.forEach(entity.spawnEntity);
    }
    entity.lastPositionPlayersUpdated=entity.position.clone();

    const playersToAdd = entitiesToAdd.filter(e => e.type == 'player');
    const playersToRemove = entitiesToRemove.filter(e => e.type == 'player');

    playersToRemove.forEach(p => p.despawnEntities([entity]));
    playersToRemove.forEach(p => p.nearbyEntities=p.getNearby());
    playersToAdd.forEach(p => p.spawnEntity(entity));
    playersToAdd.forEach(p => p.nearbyEntities=p.getNearby());

    entity.nearbyEntities=updatedEntities;
  };


  entity.on("move",() => {
    if(entity.position.distanceTo(entity.lastPositionPlayersUpdated)>2*32)
      entity.updateAndSpawn();
  });

  entity.destroy = () => {
    serv.destroyEntity(entity);
  };

  entity.attach= (attachedEntity,leash=false) =>
  {
    const p={
      entityId:attachedEntity.id,
      vehicleId:entity.id,
      leash:leash
    };
    if(entity.type=='player')
      entity._client.write('attach_entity',p);
    entity._writeOthersNearby('attach_entity',p);
  }

};
