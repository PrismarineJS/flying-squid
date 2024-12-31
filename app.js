#!/usr/bin/env node
// process.env.DEBUG = 'minecraft-protocol'
Error.stackTraceLimit = 1000

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
    description: 'Enable logging: When true create a log file in the logs folder',
    type: 'boolean',
    default: 'true'
  })
  .option('op', {
    description: 'Useful for testing. When specified, op every player (give administrative permissions)',
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

module.exports = mcServer.createMCServer({
  ...settings,
  // Create a separate world folder for each version as the world format changes between versions
  // and we don't actually support upgrading worlds between versions
  worldFolder: 'world/' + settings.version,
  debug: console.log
})

process.on('unhandledRejection', err => {
  console.log(err.stack)
})
