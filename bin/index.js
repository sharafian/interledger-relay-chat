'use strict'

process.on('unhandledRejection', console.error)

const reduct = require('reduct')
const App = require('../src/client/app')

if (require.main === module) {
  const app = reduct()(App)
  app.listen().catch(e => {
    console.error(e)
    process.exit(1)
  })
} else {
  module.exports = {
    App
  }
}
