module.exports.player = function (player, serv) {
  player._client.on('tab_complete', function (data) {
    // console.log(data)
    const textSplit = data.text.split(' ')
    if (textSplit[0].startsWith('/')) {
      const cmds = []
      for (const cmd in serv.commands.uniqueHash) {
        const cmdFull = serv.commands.uniqueHash[cmd]
        if (!player.op && cmdFull.params.op) continue
        cmds.push(`/${cmd}`)
      }

      if (serv.commands.uniqueHash[textSplit[0].slice(1)]) {
        if (data.lookedAtBlock) serv.tabComplete.use(serv.commands.tab(textSplit[0].slice(1), textSplit.length - 2), data.lookedAtBlock)
        else serv.tabComplete.use(serv.commands.tab(textSplit[0].slice(1), textSplit.length - 2))
      } else {
        player._client.write('tab_complete', {
          matches: cmds
        })
      }
    } else {
      serv.tabComplete.use('player')
    }
  })

  serv.tabComplete = {
    types: [],

    use: function (id, otherData = null) {
      if (id === undefined) return
      player._client.write('tab_complete', {
        matches: this.types[id](otherData) || this.types.player()
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
    for (const cmd in serv.commands.uniqueHash) {
      const cmdFull = serv.commands.uniqueHash[cmd]
      if (!player.op && cmdFull.params.op) continue
      cmds.push(cmd)
    }
    return cmds
  })

  serv.tabComplete.add('time', () => {
    return ['add', 'set', 'query']
  })

  serv.tabComplete.add('blockX', (blockInfo) => {
    if (blockInfo === null) return ['']
    const x = String(blockInfo.x)
    return [x] || ['']
  })
  serv.tabComplete.add('blockY', (blockInfo) => {
    if (blockInfo === null) return ['']
    const y = String(blockInfo.y)
    return [y] || ['']
  })
  serv.tabComplete.add('blockZ', (blockInfo) => {
    if (blockInfo === null) return ['']
    const z = String(blockInfo.z)
    return [z] || ['']
  })
}
