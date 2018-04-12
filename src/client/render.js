const readLine = require('readline')
const stripAnsi = require('strip-ansi')
const chalk = require('chalk')
const EventEmitter = require('events')

const COLORS = [
  chalk.green,
  chalk.blue,
  chalk.yellow,
  chalk.magenta,
  chalk.cyan
]

class Render extends EventEmitter {
  constructor (deps) {
    super()
    this.rl = readLine.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    this.colorIndex = 0
    this.colorMap = new Map()
    this.tty = true
  }

  enableTTY () {
    this.tty = true
  }

  disableTTY () {
    this.tty = false
  }

  _color (nick, text) {
    if (!this.colorMap.get(nick)) {
      this.colorMap.set(nick, COLORS[this.colorIndex])
      this.colorIndex = (this.colorIndex + 1) % COLORS.length
    }

    return this.colorMap.get(nick)(text)
  }

  clearText (line) {
    if (!this.tty) return
    const linesToClear = line.length / process.stdout.columns
    for (let i = 0; i < linesToClear; ++i) {
      readLine.moveCursor(process.stdout, 0, -1)
      readLine.clearLine(process.stdout, 0)
    }
  }

  printNickConfirm (nick) {
    console.log('confirmed nick', this._color(nick, stripAnsi(nick)))
  }

  printError (error) {
    console.log(chalk.red(error.error))
  }

  printInfo (message) {
    console.log(chalk.grey(message))
  }

  printNotification (n) {
    if (this.tty) {
      readLine.cursorTo(process.stdout, 0, null)
      readLine.clearLine(process.stdout, 0)
    }

    switch (n.type) {
      case 'error':
        console.log(stripAnsi(n.error))
        break

      case 'privmsg':
        console.log(this._color(n.nick, stripAnsi(n.nick) + ':'), stripAnsi(n.message))
        break

      case 'success':
        break

      default:
        console.log(stripAnsi(JSON.stringify(n)))
        break
    }

    if (this.tty) {
      this.rl.prompt()
    }
  }

  async init () {
    this.rl.on('line', line => this.emit('line', line))
    this.rl.setPrompt('>> ')
    this.rl.prompt()
  }

  prompt () {
    if (this.tty) {
      this.rl.prompt()
    }
  }
}

module.exports = Render
