'use strict'

let fs = require('fs')
let path = require('path')
let getStdin = require('remote').require('./get-stdin')
let argv = require('remote').require('./argv')
let mapboxgl = require('mapbox-gl/dist/mapbox-gl.js')
let extent = require('./reduce-extent')

let turf = require('turf')
window.turf = turf

// base styles
let styles

let style = argv.style || 'mapbox://styles/anandthakker/ciku12ple008m92klkh7ujf32'
mapboxgl.accessToken = argv.accessToken || 'pk.eyJ1IjoiYW5hbmR0aGFra2VyIiwiYSI6InJJSEp4RFkifQ.Ea75OuvCgvTqmnYwq6udeg'

var map = window.map = new mapboxgl.Map({
  container: 'map',
  style: style,
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
    if (argv._.length) {
      argv._.forEach((data) => addData(batch, 'data_' + idCounter++, data, dataLayers))
    } else {
      addData(batch, 'stdin', 'stdin://data', dataLayers)
    }
  })

  window.data = {}
  window.addToMap = function (data) {
    map.batch(function (batch) {
      addData(batch, 'data_' + idCounter++, data, dataLayers)
      fitBounds(data)
    })
  }

  console.log('%cData is available to play with on window.data, as is Turf.js', 'color: blue; font-weight: bold;')
  console.log('Add data to the map with addToMap(moreGeojson)')
  if (argv._.length) {
    const data = argv._.map((f) => JSON.parse(fs.readFileSync(f)))
    argv._.forEach((f, i) => {
      f = path.basename(f).replace(/\..*$/, '')
      console.log('%c' + f, 'color: green; font-weight: bold;')
      console.log(data[i])
      window.data[f] = data[i]
    })
    fitBounds(data)
  } else {
    getStdin(function (data) {
      data = JSON.parse(data)
      console.log('%cSTDIN', 'color: green; font-weight: bold;')
      console.log(data)
      window.data.STDIN = data
      fitBounds(data)
    })
  }
}

function fitBounds (data) {
  let ext
  if (Array.isArray(data)) {
    ext = data.reduce(extent, null)
  } else {
    ext = extent(data)
  }
  map.fitBounds([ [ext[0], ext[1]], [ext[2], ext[3]] ], {
    speed: 3,
    curve: 1.1,
    padding: 20
  })

  // let el = document.getElementById('map')
  // let bounds = el.getBoundingClientRect()
  // bounds = [[0, 0], [bounds.width, bounds.height]]
  // console.log(bounds, dataLayers)
  // map.featuresIn(bounds, {
  //   includeGeometry: true,
  //   layer: dataLayers
  // }, function (err, features) {
  //   if (err) { throw err }
  //   let ext = extent({ type: 'FeatureCollection', features: features })
  //   console.log(ext, features)
  //   map.fitBounds([ [ext[0], ext[1]], [ext[2], ext[3]] ])
  // })
}

function addData (batch, id, data, layers) {
  if (!batch) { batch = window.map }
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
