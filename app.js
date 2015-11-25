#!/usr/bin/env node

var mcServer=require("./");

var settings;

try {
  settings = require('./config/settings');
}
catch(err) {
  settings = require('./config/default-settings');
}

module.exports=mcServer.createMCServer(settings);


