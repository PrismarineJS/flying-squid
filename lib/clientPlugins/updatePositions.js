var vec3 = require("vec3");

module.exports=inject;

function toFixedPosition(p)
{
  return new vec3(Math.floor(p.x*32),Math.floor(p.y*32),Math.floor(p.z*32))
}

function inject(serv,client)
{
  client.on('position', function (packet) {
    var position = new vec3(packet.x, packet.y, packet.z);
    var onGround = packet.onGround;
    sendRelativePositionChange(client, toFixedPosition(position), onGround);
  });

  function sendRelativePositionChange(client, newPosition, onGround) {
    if (serv.uuidToPlayer[client.uuid].position) {
      var diff = newPosition.minus(serv.uuidToPlayer[client.uuid].position);
      if (diff.distanceTo(new vec3(0, 0, 0)) != 0) {

        serv.writeOthers(client,'rel_entity_move', {
          entityId: client.id,
          dX: diff.x,
          dY: diff.y,
          dZ: diff.z,
          onGround: onGround
        });
      }
    }
    serv.uuidToPlayer[client.uuid].position = newPosition;
    serv.uuidToPlayer[client.uuid].onGround = onGround;
  }
}