const { literal } = require('node-brigadier')

module.exports.brigadier = (dispatcher, serv) => {
    const GAMEMODES = {
        survival: 0,
        creative: 1,
        adventure: 2,
        spectator: 3
    }
    const literalArgumentBuilder = literal('gamemode')
    for (const gamemode in GAMEMODES) {
        literalArgumentBuilder
            .requires((c) => c.player.op)
            .then(literal(gamemode)
            .executes(c => {
              const source = c.getSource()
              source.player.setGameMode(GAMEMODES[gamemode])
              return 0
            }))
    }
    dispatcher.register(literalArgumentBuilder);
}
