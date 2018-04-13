const Render = require('./render')
const Sender = require('./sender')
const Config = require('./config')

const os = require('os')
const fs = require('fs-extra')
const path = require('path')

class Interface {
  constructor (deps) {
    this.sender = deps(Sender)
    this.render = deps(Render)
    this.config = deps(Config)
  }

  async _line (cmd) {
    this.render.clearText(cmd)

    if (cmd.startsWith('/connect')) {
      const [, endpoint ] = cmd.split(' ')
      await this.sender.connect(endpoint)
    } else if (cmd.startsWith('/nick')) {
      const [, nick, password ] = cmd.split(' ')
      const response = await this.sender.call({ type: 'nick', nick, password })

      if (response.type === 'success') {
        this.render.printNickConfirm(nick)
      } else {
        this.render.printError(response)
      }
    } else if (cmd.startsWith('/pay')) {
      const [, payee, amount ] = cmd.split(' ')
      const response = await this.sender.call({ type: 'pay', channel: '#global', payee }, amount)

      if (response.type === 'success') {
        // this.render.printPayConfirm(payee, amount)
      } else {
        this.render.printError(response)
      }
    } else if (cmd.match(/^\s*$/)) {
    } else if (!cmd.startsWith('/')) {
      const response = await this.sender.call({ type: 'privmsg', message: cmd, channel: '#global' })
      if (response.type === 'error') {
        this.render.printError(response)
      }
    }

    this.render.prompt()
  }

  async init () {
    // auto-play some commands for configuration
    const macroFile = this.config.argv.file ||
      path.join(os.homedir(), '.ilrcrc')

    if (await fs.exists(macroFile)) {
      this.render.disableTTY()
      const text = await fs.readFile(macroFile, 'utf8')
      const lines = text.split('\n')
      for (const line of lines) {
        await this._line(line)
      }
      this.render.enableTTY()
    }

    await this.render.init()
    this.render.on('line', this._line.bind(this))
  }
}

module.exports = Interface
