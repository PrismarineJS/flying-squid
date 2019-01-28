/* eslint-env jest */
const squid = require('flying-squid')
const settings = require('../config/default-settings')
const path = require('path')
const fs = require('fs')

describe('test import third-party plugins', () => {
  const pluginPath = path.resolve(__dirname, '../', 'src', 'plugins', 'example')
  const filePath = path.resolve(__dirname, '../', 'src', 'plugins', 'example', 'index.js')
  beforeAll(() => {
    if (!fs.existsSync(pluginPath)) {
      fs.mkdirSync(pluginPath)
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'module.exports.server = function (serv, options) {\n\n}\n\nmodule.exports.player = function (player, serv, settings) {\n\n}\n')
    }
  })

  let serv = null

  beforeEach(() => {
    const options = settings
    options['plugins'] = {
      'example': {}
    }
    serv = squid.createMCServer(options)
  })

  it('should load third-party plugin example', () => {
    expect(serv.plugins['example']).toBeDefined()
    expect(serv.plugins['example'].server).toBeInstanceOf(Function)
    expect(serv.plugins['example'].player).toBeInstanceOf(Function)
  })

  afterEach(async () => {
    await serv.quit()
  })

  afterAll((done) => {
    serv._server.close()
    serv._server.on('close', () => {
      done()
    })
  })
})
