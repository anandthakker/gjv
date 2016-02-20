#!/usr/bin/env node

require('../argv') // nicer usage message if we parse from here

const spawn = require('child_process').spawn
const electron = require('electron-prebuilt')
const path = require('path')
var args = [ path.join(__dirname, '../index.js') ].concat(process.argv.slice(2))

var proc = spawn(electron, args, { stdio: 'inherit' })
proc.on('close', function (code) {
  process.exit(code)
})
