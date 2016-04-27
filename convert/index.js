'use strict'
const fs = require('fs')
const path = require('path')
const queue = require('queue-async')
const sniff = require('mapbox-file-sniff').sniff
const getStdin = require('remote').require('./get-stdin')

const types = {
  geojson: require('./geojson'),
  shp: require('./shp')
}

module.exports = function convert (files, callback) {
  const q = queue()
  files
  .forEach(function (file) {
    q.defer(function (cb) { handleFile(file, cb) })
  })
  q.awaitAll(callback)
}

function handleFile (file, cb) {
  if (file.startsWith('stdin://')) {
    getStdin(function (stdin) { handleData(stdin, cb) })
  } else {
    file = path.resolve(process.cwd(), file)
    fs.readFile(file, function (err, data) {
      if (err) { return cb(err) }
      handleData(data, cb)
    })
  }

  function handleData (data, cb) {
    sniff(data, function (err, type) {
      if (err) { return cb(err) }
      if (!types[type]) { return cb(new Error('Unknown type: ' + type)) }
      types[type]({
        name: path.basename(file).replace(/\.[^.]*$/, ''),
        url: file,
        data: data
      }, cb)
    })
  }
}

