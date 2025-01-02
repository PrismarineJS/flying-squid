module.exports.server = function (serv) {
  serv.broadcast = (message, { whitelist = serv.players, blacklist = [], system = false } = {}) => {
    if (whitelist.type === 'player') whitelist = [whitelist]

    if (typeof message === 'string') message = serv.parseClassic(message)

    whitelist.filter(w => blacklist.indexOf(w) === -1).forEach(player => {
      if (!system) player.chat(message)
      else player.system(message)
    })
  }

  serv.color = {
    black: '&0',
    dark_blue: '&1',
    dark_green: '&2',
    dark_cyan: '&3',
    dark_red: '&4',
    purple: '&5',
    dark_purple: '&5',
    gold: '&6',
    gray: '&7',
    grey: '&7',
    dark_gray: '&8',
    dark_grey: '&8',
    blue: '&9',
    green: '&a',
    aqua: '&b',
    cyan: '&b',
    red: '&c',
    pink: '&d',
    light_purple: '&d',
    yellow: '&e',
    white: '&f',
    random: '&k',
    obfuscated: '&k',
    bold: '&l',
    strikethrough: '&m',
    underlined: '&n',
    underline: '&n',
    italic: '&o',
    italics: '&o',
    reset: '&r'
  }

  serv.parseClassic = (message) => {
    if (typeof message === 'object') return message
    const messageList = []
    let text = ''
    let nextChanged = false
    let color = 'white'
    let bold = false
    let italic = false
    let underlined = false
    let strikethrough = false
    let random = false
    const colors = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'k', 'l', 'm', 'n', 'o', 'r', '&']
    const convertColor = ['black', 'dark_blue', 'dark_green', 'dark_cyan', 'dark_red', 'dark_purple', 'gold',
      'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white',
      'random', 'bold', 'strikethrough', 'underlined', 'italic', 'reset', '&']

    function createJSON () {
      if (!text.trim()) return
      messageList.push({
        text,
        color,
        bold,
        italic,
        underlined,
        strikethrough,
        obfuscated: random
      })
      text = ''
    }

    while (message !== '') {
      const currChar = message[0]
      if (nextChanged) {
        const newColor = convertColor[colors.indexOf(currChar)]
        if (newColor) {
          if (newColor === 'bold') bold = true
          else if (newColor === 'strikethrough') strikethrough = true
          else if (newColor === 'underlined') underlined = true
          else if (newColor === 'italic') italic = true
          else if (newColor === 'random') random = true
          else if (newColor === '&') text += '&'
          else if (newColor === 'reset') {
            strikethrough = false
            bold = false
            underlined = false
            random = false
            italic = false
            color = 'white'
          } else color = newColor
        }
        nextChanged = false
      } else if (currChar === '&') {
        if (nextChanged) {
          text += '&'
          nextChanged = false
        } else {
          nextChanged = true
          createJSON()
        }
      } else {
        text += currChar
      }

      message = message.slice(1, message.length)
    }
    createJSON()

    if (messageList.length > 0) {
      return {
        text: '',
        extra: messageList
      }
    } else return { text: '' }
  }
}

module.exports.player = function (player, serv) {
  // 1.19+ -- from nmp server example - not implementing chat singing yet, so all messages are sent as system_chat
  function handleChatMessage (data) {
    const fmtMessage = `<${player.username}> ${data.message}`
    serv.broadcast(fmtMessage, { whitelist: serv.players, blacklist: [] })
    // broadcast(fmtMessage, null, player.username)
  }

  player._client.on('chat_message', (data) => {
    player.behavior('chat', {
      message: data.message,
      prefix: '<' + player.username + '> ',
      text: data.message,
      whitelist: serv.players,
      blacklist: [],
      data
    }, ({ data }) => {
      handleChatMessage(data)
    })
  })
  player._client.on('chat_command', (data) => {
    const command = data.command
    player.behavior('command', { command }, ({ command }) => {
      player.handleCommand(command)
    })
  })

  player._client.on('chat', ({ message } = {}) => {
    if (message[0] === '/') {
      player.behavior('command', { command: message.slice(1) }, ({ command }) => player.handleCommand(command))
      serv.info(`${player.username} issued command: ${message.split(' ')[0]}`)
    } else {
      player.behavior('chat', {
        message,
        prefix: '<' + player.username + '> ',
        text: message,
        whitelist: serv.players,
        blacklist: []
      }, ({ prefix, text, whitelist, blacklist }) => {
        const obj = serv.parseClassic(prefix)
        if (!obj.extra) obj.extra = []
        obj.extra.push(serv.parseClassic(text))
        serv.broadcast(obj, {
          whitelist,
          blacklist
        })
      })
    }
  })

  player.chat = message => {
    if (serv.supportFeature('signedChat')) {
      return player.system(message)
    } else {
      const chatComponent = typeof message === 'string' ? serv.parseClassic(message) : message
      player._client.write('chat', {
        message: JSON.stringify(chatComponent),
        position: 0,
        sender: '0'
      })
    }
  }

  player.emptyChat = (count = 1) => {
    for (let i = 0; i < count; i++) {
      player.chat('')
    }
  }

  player.system = message => {
    const chatComponent = typeof message === 'string' ? serv.parseClassic(message) : message
    if (serv.supportFeature('signedChat')) {
      player._client.write('system_chat', {
        content: JSON.stringify(chatComponent),
        type: 1, // chat
        isActionBar: false
      })
    } else {
      player._client.write('chat', {
        message: JSON.stringify(chatComponent),
        position: 2,
        sender: '0'
      })
    }
  }

  // const nbt = require('prismarine-nbt')
  // function sendBroadcastMessage (server, clients, message, sender) {
  //   function chatText (text) {
  //     return serv.supportFeature('chatPacketsUseNbtComponents')
  //       ? nbt.comp({ text: nbt.string(text) })
  //       : JSON.stringify({ text })
  //   }
  //   console.log('sendBroadcastMessage', message, sender, chatText(message))
  //   server.writeToClients(clients, 'player_chat', {
  //     plainMessage: message,
  //     signedChatContent: '{"text":""}',
  //     //unsignedChatContent: chatText(message),
  //     type: 0,
  //     senderUuid: 'd3527a0b-bc03-45d5-a878-2aafdd8c8a43', // random
  //     senderName: JSON.stringify({ text: 'x' }),
  //     senderTeam: undefined,
  //     timestamp: Date.now(),
  //     salt: 0n,
  //     signature: serv.supportFeature('useChatSessions') ? undefined : Buffer.alloc(0),
  //     previousMessages: [],
  //     filterType: 0,
  //     networkName: JSON.stringify({ text: 'v' })
  //   })
  // }
  // function broadcast (message, exclude, username) {
  //   sendBroadcastMessage(serv._server, Object.values(serv._server.clients).filter(client => client !== exclude), message, username)
  // }
}
