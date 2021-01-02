#!/usr/bin/env node

const argv = require('yargs/yargs')(process.argv.slice(2))
  .usage('Usage: $0 <command> [options]')
  .help('h')
  .option('config', {
    alias: 'c',
    type: 'string',
    default: './config',
    description: 'Configuration directory'
  })
  .argv

const mcServer = require('./')

const defaultSettings = require('./config/default-settings')

let settings

try {
  settings = require(`${argv.config}/settings`)

  Object.keys(defaultSettings).forEach(settingKey => {
    if (settings[settingKey] === undefined) {
      settings[settingKey] = defaultSettings[settingKey]
    }
  })
} catch (err) {
  settings = defaultSettings
}

module.exports = mcServer.createMCServer(settings)

process.on('unhandledRejection', err => {
  console.log(err.stack)
})
