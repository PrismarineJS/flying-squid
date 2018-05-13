const mcServer = require('flying-squid')

mcServer.createMCServer({
  'motd': 'A Minecraft Server \nRunning flying-squid',
  'port': 25565,
  'max-players': 10,
  'online-mode': true,
  'logging': true,
  'gameMode': 1,
  'generation': {
    'name': 'diamond_square',
    'options': {
      'worldHeight': 80
    }
  },
  'kickTimeout': 10000,
  'plugins': {

  },
  'modpe': false,
  'view-distance': 10
})
