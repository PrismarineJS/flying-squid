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
  .option('offline', {
    type: 'boolean',
    default: 'false'
  })
  .option('log', {
    description: 'Enable logging: When true create log file in logs folder',
    type: 'boolean',
    default: 'true'
  })
  .option('op', {
    description: 'Useful for testing. When true gives everybody op (administrative permissions)',
    type: 'boolean',
    default: 'false'
  })
  .argv

const mcServer = require('./')

const defaultSettings = require('./config/default-settings.json')

let settings

try {
  settings = require(`${argv.config}/settings.json`)
} catch (err) {
  settings = {}
}

settings = Object.assign(settings, defaultSettings, settings)
if (argv.offline) settings['online-mode'] = false
if (argv.log) settings.logging = true
if (argv.op) settings['everybody-op'] = true

module.exports = mcServer.createMCServer(settings)

process.on('unhandledRejection', err => {
  console.log(err.stack)
})
