const yargs = require('yargs')
class Config {
  constructor (deps) {
    this.argv = yargs.argv
  }
}

module.exports = Config
