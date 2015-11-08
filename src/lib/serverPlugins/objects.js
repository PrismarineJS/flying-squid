var Entity=require("prismarine-entity");
var vec3 = require("vec3");

module.exports = inject;

function inject(serv) {
  serv.spawnObject = (type, world, position, {pitch=0,yaw=0,velocity=vec3(0,0,0),data=0}={}) => {
    serv.entityMaxId++;
    var object = new Entity(serv.entityMaxId);
    object.type = 'object';
    object.entityType = type;
    object.data = data;
    object.velocity = velocity.scaled(32).floored();
    object.pitch = pitch;
    object.yaw = yaw;
    object.world = world;
    object.gravity = vec3(0, -20*32, 0);
    object.terminalvelocity = vec3(27*32, 27*32, 27*32);
    object.friction = vec3(0.91*32, 0, 0.91*32).floored();
    object.position = position.scaled(32).floored();
    object.size = vec3(0.25*32, 0.25*32, 0.25*32); // Hardcoded, will be dependent on type!
    serv.entities[object.id] = object;

    var scaledVelocity = object.velocity.scaled(250/20).floored(); // from fixed-position/second to unit => 1/8000 blocks per tick

    serv._writeNearby('spawn_entity', {
      entityId: object.id,
      type: object.entityType,
      x: object.position.x,
      y: object.position.y,
      z: object.position.z,
      pitch: object.pitch,
      yaw: object.yaw,
      objectData: {
        intField: data,
        velocityX: scaledVelocity.x,
        velocityY: scaledVelocity.y,
        velocityZ: scaledVelocity.z
      }
    }, {
      world: world,
      position: object.position
    });

    setTimeout(() => {
      serv.destroyEntity(object);
    }, 1000*10);
  }
}