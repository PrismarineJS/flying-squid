module.exports.player = function (player, serv) {
    serv.tabComplete = {
        types: [],
    
        use: function (id) {
            if (id === undefined) return
            player._client.write('tab_complete', {
                matches: this.types[id]() ? this.types[id]() : this.types['player']()
            })
        },
        add: function (id, cb) {
            this.types[id] = cb
        }
    }

    serv.tabComplete.add('player', () => {
        const playerNames = []
        for (const player of serv.players) playerNames.push(player.username)
        return playerNames
    })

    serv.tabComplete.add('selector', () => {
        const playerNames = []
        const selectors = ['@p', '@a', '@e', '@r']
        for (const player of serv.players) playerNames.push(player.username)
        for (const sel in selectors) playerNames.push(selectors[sel])
        return playerNames
    })

    serv.tabComplete.add('number', () => {
        return ['1']
    })

    serv.tabComplete.add('command', () => {
        const cmds = []
        for (var cmd in serv.commands.uniqueHash) {
            var cmdFull = serv.commands.uniqueHash[cmd]
            if (!player.op && cmdFull.params.op) continue
            cmds.push(cmd)
        }
        return cmds
    })

    serv.tabComplete.add('time', () => {
        return ['add', 'set', 'query']
    })
}