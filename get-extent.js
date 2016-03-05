'use strict'
let extent = require('turf-extent')

function getExtent (geojson) {
  let ext = extent(geojson)
  // special case for points
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
  return ext
}

module.exports = getExtent
