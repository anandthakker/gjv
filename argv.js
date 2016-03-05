const argv = require('yargs')
.options({
  'b': {
    alias: 'basemap',
    default: 'mapbox://styles/mapbox/streets-v8',
    describe: 'an alternate mapbox://styles/... url to use as a basemap.'
  },
  't': {
    alias: 'accessToken',
    describe: 'The mapbox access token to use; goes well with --style.'
  },
  'j': {
    alias: 'showJson',
    describe: 'Open the dev tools panel to show the GeoJSON data.'
  },
  'h': { alias: 'help' }
})
.help('h')
.usage('Usage: $0 [FILE] or cat some.geojson | $0')
.argv

// include stdin if it isn't in the list
if (!process.stdin.isTTY && !argv._.some((f) => f.startsWith('stdin://'))) {
  argv._.push('stdin://stdin')
}

module.exports = argv
