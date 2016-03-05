'use strict'

module.exports = function reduceExtent (previousExtent, ext) {
  if (!ext) {
    ext = previousExtent
    previousExtent = null
  }

  return Array.isArray(previousExtent) ? [
    Math.min(ext[0], previousExtent[0]),
    Math.min(ext[1], previousExtent[1]),
    Math.max(ext[2], previousExtent[2]),
    Math.max(ext[3], previousExtent[3])
  ] : ext
}
