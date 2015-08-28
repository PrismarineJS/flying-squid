module.exports=inject;

function inject(serv, player) 
{
  player._client.on("arm_animation", function(packet) {
    player._writeOthers("animation", {
      entityId: player.entity.id,
      animation: 0
    });
  });
}