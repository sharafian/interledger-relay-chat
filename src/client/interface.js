const Render = require('./render')
const Sender = require('./sender')

class Interface {
  constructor (deps) {
    this.sender = deps(Sender)
    this.render = deps(Render)
  }

  async _line (cmd) {
    this.render.clearText(cmd)

    if (cmd.startsWith('/connect')) {
      const [, endpoint ] = cmd.split(' ')
      await this.sender.connect(endpoint)
    } else if (cmd.startsWith('/nick')) {
      const [, nick ] = cmd.split(' ')
      const response = await this.sender.call({ type: 'nick', nick })
      if (response.type === 'success') {
        this.render.printNickConfirm(nick)
      } else {
        this.render.printError(response)
      }
    } else if (!cmd.startsWith('/')) {
      const response = await this.sender.call({ type: 'privmsg', message: cmd, channel: '#global' })
      if (response.type === 'error') {
        this.render.printError(response)
      }
    }

    this.render.prompt()
  }

  async init () {
    await this.render.init()
    this.render.on('line', this._line.bind(this))
  }
}

module.exports = Interface
