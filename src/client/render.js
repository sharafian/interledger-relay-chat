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

    return this.colorMap.get(nick)(stripAnsi(text || nick))
  }

  clearText (line) {
    if (!this.tty) return
    const linesToClear = line.length / process.stdout.columns
    for (let i = 0; i < linesToClear; ++i) {
      readLine.moveCursor(process.stdout, 0, -1)
      readLine.clearLine(process.stdout, 0)
    }
  }

  clearLine () {
    if (this.tty) {
      readLine.cursorTo(process.stdout, 0, null)
      readLine.clearLine(process.stdout, 0)
    }
  }

  printNickConfirm (nick) {
    this.clearLine()
    console.log('\rconfirmed nick', this._color(nick))
  }

  printPayConfirm (nick, amount) {
    this.clearLine()
    console.log('paid ' + chalk.yellow(amount) + ' to ' + this._color(nick))
  }

  printError (error) {
    console.log(chalk.red(error.error))
  }

  printInfo (message) {
    console.log(chalk.grey(message))
  }

  printNotification (n, money) {
    this.clearLine()

    switch (n.type) {
      case 'error':
        console.log(stripAnsi(n.error))
        break

      case 'privmsg':
        console.log(this._color(n.nick, n.nick + ':'), stripAnsi(n.message))
        break

      case 'success':
        break

      case 'pay':
        if (n.nick === n.payee) {
          if (money) {
            console.log('you paid yourself', chalk.yellow(money))
          } else {
            console.log(this._color(n.nick), 'paid themselves', chalk.yellow(n.money))
          }
        } else {
          if (money) {
            console.log(this._color(n.nick), 'paid you', chalk.yellow(money))
          } else {
            console.log(this._color(n.nick), 'paid', chalk.yellow(n.money),
              'to', this._color(n.payee))
          }
        }
        break

      default:
        console.log(stripAnsi(JSON.stringify(n)), money)
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
