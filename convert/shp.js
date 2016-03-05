'use strict'
const fs = require('fs')
const tmp = require('tmp')
const toJson = require('shp2json').fromShpFile
const geojson = require('./geojson')

module.exports = function shpToJson (file, callback) {
  tmp.file({ prefix: file.name, postfix: 'geojson' }, function (err, output) {
    let buffs = []
    let bytes = 0

    if (err) { return callback(err) }
    toJson(file.url)
    .on('data', function (d) {
      bytes += d.length
      buffs.push(d)
    })
    .on('error', function (err) {
      this.removeAllListers()
      callback(err)
    })
    .on('end', function () {
      file.url = output
      file.data = Buffer.concat(buffs, bytes)
      geojson(file, callback)
    })
    .pipe(fs.createWriteStream(output))
  })
}
