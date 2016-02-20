'use strict'

let fs = require('fs')
let path = require('path')
let mapboxgl = require('mapbox-gl/dist/mapbox-gl.js')
let toColor = require('to-color')
let isReachable = require('remote').require('is-reachable')
let getStdin = require('remote').require('./get-stdin')
let argv = require('remote').require('./argv')
let extent = require('./reduce-extent')
let config = require('./config')
let dataStyle = require('./base-styles.json')
let turf = require('turf')

mapboxgl.accessToken = argv.accessToken || config.mapboxAccessToken
window.turf = turf

const dataLayers = {
  point: dataStyle.layers.find((l) => l.id === 'point-data'),
  line: dataStyle.layers.find((l) => l.id === 'line-data'),
  polygon: dataStyle.layers.find((l) => l.id === 'polygon-data')
}

let map
let basemap
isReachable('mapbox.com', function (_, online) {
  if (!online) { argv.basemap = 'offline' }
  if (/^(plain|land|offline)$/.test(argv.basemap)) {
    basemap = dataStyle
  } else if (!argv.basemap) {
    basemap = dataStyle
    dataStyle.layers.forEach((layer) => { layer.layout.visibility = 'none' })
  } else if (!hasScheme(argv.basemap)) {
    // assume it's a mapbox style, so prepend mapbox://styles/
    basemap = 'mapbox://styles/' + argv.basemap
  } else {
    // do this because 'basemap' will still be set on a ctrl-R reload
    basemap = basemap || argv.basemap
  }

  map = window.map = new mapboxgl.Map({
    container: 'map',
    style: basemap,
    center: [0, 0],
    zoom: 2
  })

  map.on('load', onMapLoad)
})

let userData = window.data = {}
function onMapLoad () {
  printApiHelp()

  getStdin(function (stdin) {
    // resolve local file references that arent 'something://'
    const files = argv._.map((f) => {
      if (!hasScheme(f)) {
        return path.resolve(process.cwd(), f)
      } else {
        return f
      }
    })

    // include stdin if it isn't in the list
    if (stdin && !files.some((f) => f.startsWith('stdin://'))) {
      files.push('stdin://stdin')
    }

    // get actual data for each file in the list (used for finding view bounds)
    const data = files.map((f) => {
      if (f.startsWith('stdin://')) {
        return JSON.parse(stdin)
      } else {
        f = path.resolve(process.cwd(), f)
        return JSON.parse(fs.readFileSync(f))
      }
    })

    map.batch(function (batch) {
      files.forEach((f, i) => {
        let id = unique(map.getStyle().sources, path.basename(f).replace(/\..*$/, ''))
        let actualData = data[i]
        addData(batch, id, f)
        userData[id] = actualData
      })
    })

    fitGeojsonExtent(data)
    printData(userData)
  })

  // set up a little console API
  window.addToMap = function (data) {
    map.batch(function (batch) {
      addData(batch, unique(map.getStyle().sources, 'data'), data)
      fitGeojsonExtent(data)
    })
  }
  window.fitGeojsonExtent = fitGeojsonExtent
}

function unique (sources, attemptedId) {
  let count = 1
  attemptedId = attemptedId || ''
  let current = attemptedId
  while (sources[current]) { current = [attemptedId, count++].join('-') }
  return current
}

function fitGeojsonExtent (data) {
  let ext
  if (Array.isArray(data)) {
    ext = data.reduce(extent, null)
  } else {
    ext = extent(data)
  }
  if (ext.some(isNaN)) { return }
  map.fitBounds([ [ext[0], ext[1]], [ext[2], ext[3]] ], {
    speed: 3,
    curve: 1.1,
    padding: 20
  })
}

function addData (batch, id, data) {
  const colorProperties = [
    'fill-color',
    'line-color',
    'circle-color'
  ]
  let color = toColor(id, 1)
  batch.addSource(id, new mapboxgl.GeoJSONSource({data: data}))
  for (let type in dataLayers) {
    let style = Object.assign({}, dataLayers[type], {
      id: id + '_' + type,
      source: id,
      layout: Object.assign({}, dataLayers[type].layout),
      paint: Object.assign({}, dataLayers[type].paint)
    })
    style.layout.visibility = 'visible'
    colorProperties.forEach((key) => {
      if (style.paint[key]) { style.paint[key] = color }
    })
    batch.addLayer(style)
  }
}

function printApiHelp () {
  const message = `
  %cData is available to play with in window.data, and Turf.js is in scope as
  %cturf.*%c (see http://turfjs.org/).

  Add data to the map with %caddDataToMap(moreGeojson)`

  let text = 'color: blue; font-weight: normal;'
  let code = 'color: black; font-weight: bold; font-family: monospace;'
  console.info(message, text, code, text, code)
}

function printData (data) {
  for (let k in data) {
    console.log('%c' + k, 'color: green; font-weight: bold;')
    console.log(data[k])
  }
}

function hasScheme (url) {
  return /^[a-z]*:\/\//i.test(url)
}
