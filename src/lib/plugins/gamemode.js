const { literal, argument, string } = require('node-brigadier')
const GAMEMODES = {
  survival: 0,
  creative: 1,
  adventure: 2,
  spectator: 3
}

module.exports.brigadier = (dispatcher, serv) => {
  // send with-out user
  for (const gamemode of Object.keys(GAMEMODES)) {
    dispatcher.register(
      literal('gamemode')
        .requires(ctx => ctx.player.op)
        .then(literal(gamemode)
          .executes(executor)))
  }
  // send with user
  for (const gamemode of Object.keys(GAMEMODES)) {
    dispatcher.register(
      literal('gamemode')
        .requires(ctx => ctx.player.op)
        .then(literal(gamemode)
          .then(argument('target', string())
            .executes(executor))))
  }
}

function executor (ctx) {
  const { player: requestingPlayer, serv } = ctx.getSource()
  const input = ctx.input.split(' ')
  const player = input[2] ? serv.getPlayer(input[2]) : requestingPlayer
  if (player) {
    player.setGameMode(GAMEMODES[input[1]])
  } else {
    // player is invalid
  }
}
