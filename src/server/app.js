const Receiver = require('./receiver')
const SPSP = require('./spsp')

class App {
  constructor (deps) {
    this._receiver = deps(Receiver)
    this._spsp = deps(SPSP)
  }

  async listen () {
    await this._receiver.init()
    await this._spsp.init()
    console.log('listening')
  }
}

module.exports = App
