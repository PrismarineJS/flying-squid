module.exports.server = (serv, { version }) => {
  const mcData = require('minecraft-data')(version)

  const oakSignType = mcData.blocksByName.standing_sign.id
  const oakWallSignType = mcData.blocksByName.wall_sign.id

  serv.on('asap', () => {
    serv.onItemPlace('sign', ({ direction, angle }) => {
      if (direction === 1) {
        return { id: oakSignType, data: Math.floor(angle / 22.5 + 0.5) & 0xF }
      }
      return { id: oakWallSignType, data: direction }
    })
  })
}

module.exports.player = function (player) {
// WIP: temporary removed
}
