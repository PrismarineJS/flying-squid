#!/usr/bin/env node

const mcServer = require('./')

const defaultSettings = require('./config/default-settings')

let settings

try {
  settings = require('./config/settings')

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
