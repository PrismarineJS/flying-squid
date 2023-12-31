const { snakeCase } = require('change-case')

module.exports.player = function (player, serv, options) {
  const sendTabComplete = (matches, existingContent) => {
    player._client.write('tab_complete', {
      matches: matches.filter((match) => match.startsWith(existingContent))
    })
  }

  player._client.on('tab_complete', function (data) {
    const textSplit = data.text.split(' ')
    if (textSplit[0].startsWith('/')) {
      const cmds = []
      for (const cmd in serv.commands.uniqueHash) {
        const cmdFull = serv.commands.uniqueHash[cmd]
        const cmdSlash = `/${cmd}`
        if (!cmdSlash.startsWith(data.text) || (!player.op && cmdFull.params.op)) continue
        cmds.push(cmdSlash)
      }

      if (serv.commands.uniqueHash[textSplit[0].slice(1)]) {
        serv.tabComplete.use(
          serv.commands.tab(textSplit[0].slice(1), textSplit.length - 2),
          data.lookedAtBlock || data.block,
          textSplit[textSplit.length - 1]
        )
      } else {
        sendTabComplete(cmds, textSplit[textSplit.length - 1])
      }
    } else {
      serv.tabComplete.use('player', null, textSplit[textSplit.length - 1])
    }
  })

  serv.tabComplete = {
    types: [],

    use: function (id, otherData = null, existingContent = '') {
      if (id === undefined || !this.types[id]) return
      const matches = this.types[id](otherData) || this.types.player()
      sendTabComplete(matches, existingContent)
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

  serv.tabComplete.add('item', () => {
    const mcData = require('minecraft-data')(options.version)
    return mcData.itemsArray.map(item => item.name)
  })

  serv.tabComplete.add('block', () => {
    const mcData = require('minecraft-data')(options.version)
    return mcData.blocksArray.map(item => item.name)
  })

  serv.tabComplete.add('entity', () => {
    const mcData = require('minecraft-data')(options.version)
    return mcData.entitiesArray.map(item => item.name)
  })

  serv.tabComplete.add('effect', () => {
    const mcData = require('minecraft-data')(options.version)
    return mcData.effectsArray.map(item => snakeCase(item.name))
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

  serv.tabComplete.add('item_enchantment', () => {
    return ['unbreaking', 'silk_touch', 'fortune']
  })
}
