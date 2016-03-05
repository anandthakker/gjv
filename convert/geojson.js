'use strict'
const fs = require('fs')
const getExtent = require('../get-extent')
module.exports = function geojson (file, callback) {
  readData()

  function readData () {
    if (!file.data) {
      fs.readFile(file.url, parse)
    } else {
      parse(null, file.data)
    }
  }

  function parse (err, data) {
    if (err) { return callback(err) }
    try {
      file.data = JSON.parse(data)
      file.extent = getExtent(file.data)
      callback(null, file)
    } catch (e) {
      callback(e)
    }
  }
}

