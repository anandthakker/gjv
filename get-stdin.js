'use strict'
const stdin = require('get-stdin')
let _stdin
module.exports = function getStdin (cb) {
  if (!_stdin) {
    stdin().then(function (data) {
      _stdin = data
      cb(_stdin)
    })
  } else {
    cb(_stdin)
  }
}

