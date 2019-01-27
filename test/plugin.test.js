/* eslint-env jest */
const squid = require('flying-squid')
const settings = require('../config/default-settings')
const rimraf = require('rimraf')
const path = require('path')
const fs = require('fs')

describe('test import third-party plugins', () => {
  const testPath = path.resolve(__dirname, '../', 'src', 'plugins', 'example')
  beforeAll(() => {
    if (!fs.existsSync(testPath)) {
      fs.mkdirSync(path.resolve(__dirname, '../', 'src', 'plugins', 'example'))
    }
    fs.writeFileSync(path.resolve(__dirname, '../', 'src', 'plugins', 'example', 'index.js'), 'module.exports.server = function (serv, options) {\n\n}\n\nmodule.exports.player = function (player, serv, settings) {\n\n}\n')
  })

  let serv = null

  beforeEach(() => {
    const options = settings
    options['plugins'] = {
      'example': {}
    }
    serv = squid.createMCServer(options)
  })

  afterEach(async () => {
    await serv.quit()
  })

  afterAll(async (done) => {
    serv._server.close()
    serv._server.on('close', () => {
      done()
    })
    await rimraf(testPath, () => console.log('removed example plugin'))
  })

  it('should load third-party plugin example', () => {
    expect(serv.plugins['example']).toBeDefined()
    expect(serv.plugins['example'].server).toBeInstanceOf(Function)
    expect(serv.plugins['example'].player).toBeInstanceOf(Function)
  })
})
