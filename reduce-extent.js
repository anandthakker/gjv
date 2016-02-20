'use strict'

let extent = require('turf-extent')
module.exports = function reduceExtent (previousExtent, geojson) {
  if (!geojson) {
    geojson = previousExtent
    previousExtent = null
  }

  let ext = extent(geojson)
  if (geojson.type === 'FeatureCollection' && geojson.features.length === 1) {
    geojson = geojson.features[0]
  }
  if (geojson.type === 'Feature' && geojson.geometry.type === 'Point') {
    const coords = geojson.geometry.coordinates
    ext = [
      coords[0] - 0.000001,
      coords[1] - 0.000001,
      coords[0] + 0.000001,
      coords[1] + 0.000001
    ]
  }

  return Array.isArray(previousExtent) ? [
    Math.min(ext[0], previousExtent[0]),
    Math.min(ext[1], previousExtent[1]),
    Math.max(ext[2], previousExtent[2]),
    Math.max(ext[3], previousExtent[3])
  ] : ext
}
