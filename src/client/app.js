const Interface = require('./interface')

class App {
  constructor (deps) {
    this._interface = deps(Interface)
  }

  async listen () {
    await this._interface.init()
  }
}

module.exports = App
