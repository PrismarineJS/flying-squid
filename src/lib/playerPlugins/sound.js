module.exports = inject;

function inject(serv, player) {
  player.playSound = (sound, opt={}) => {
    console.log(sound, opt);
    opt.whitelist = player;
    serv.playSound(sound, player.world, null, opt);
  }
}