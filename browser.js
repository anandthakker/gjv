'use strict'

let mapboxgl = require('mapbox-gl/dist/mapbox-gl.js')
let debounce = require('lodash.debounce')
let extent = require('turf-extent')

// base styles
let styles

window.start = function (args) {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hbmR0aGFra2VyIiwiYSI6InJJSEp4RFkifQ.Ea75OuvCgvTqmnYwq6udeg'
  var map = window.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/anandthakker/ciku12ple008m92klkh7ujf32',
    center: [0, 0],
    zoom: 2
  })

  map.on('load', onMapLoad)

  let idCounter = 0
  let dataLayers = []
  function onMapLoad () {
    styles = {
      point: cloneStyle(map.getLayer('point-data')),
      line: cloneStyle(map.getLayer('line-data')),
      polygon: cloneStyle(map.getLayer('polygon-data'))
    }
    styles.point.filter = [ '==', '$type', 'Point' ]
    styles.line.filter = [ '==', '$type', 'LineString' ]
    styles.polygon.filter = [ '==', '$type', 'Polygon' ]

    map.batch(function (batch) {
      if (args._.length) {
        args._.forEach((data) => addData(batch, 'data_' + idCounter++, data, dataLayers))
      } else {
        addData(batch, 'stdin', 'stdin:///', dataLayers)
      }
    })
  }

  map.on('source.change', debounce(fitBounds, 100))

  function fitBounds () {
    let el = document.getElementById('map')
    let bounds = el.getBoundingClientRect()
    bounds = [[0, 0], [bounds.width, bounds.height]]
    console.log(bounds, dataLayers)
    map.featuresIn(bounds, {
      includeGeometry: true,
      layer: dataLayers
    }, function (err, features) {
      if (err) { throw err }
      let ext = extent({ type: 'FeatureCollection', features: features })
      console.log(ext, features)
      map.fitBounds([ [ext[0], ext[1]], [ext[2], ext[3]] ])
    })
  }

  window.fitBounds = fitBounds
}

function addData (batch, id, data, layers) {
  batch.addSource(id, new mapboxgl.GeoJSONSource({data: data}))
  for (let type in styles) {
    let styleid = type + '_' + id
    let style = cloneStyle(styles[type])
    style.id = styleid
    style.source = id
    style.interactive = true
    style.layout.visibility = 'visible'
    batch.addLayer(style)
    layers.push(styleid)
  }
}

function cloneStyle (s) {
  let cloned = Object.assign({}, s)
  for (let k in cloned) {
    if (k.startsWith('_')) {
      delete cloned[k]
    }
  }
  return cloned
}
