const argv = require('yargs')
.options({
  's': {
    alias: 'style',
    describe: 'an alternate mapbox://styles/... url to use as a basemap. Expected to have "point-data", "line-data", and "polygon-data" layers that will be copied and applied to your geojson.'
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

module.exports = argv
