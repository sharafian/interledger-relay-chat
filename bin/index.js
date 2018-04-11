const IlpStream = require('ilp-protocol-stream')
const chalk = require('chalk')
const plugin = require('ilp-plugin')()
const readline = require('readline')
const SPSP = require('ilp-protocol-spsp')

async function run () {
  await plugin.connect()

  let connection = null
  let colorIndex = 0
  let nicksToColors = new Map()
  let colorTable = [
    chalk.red,
    chalk.green,
    chalk.blue,
    chalk.yellow,
    chalk.magenta,
    chalk.cyan
  ]

  function color (nick) {
    const existing = nicksToColors.get(nick)
    if (existing) {
      return existing
    }

    colorIndex = (colorIndex + 1) % colorTable.length
    nicksToColors.set(nick, colorTable[colorIndex])
    return colorTable[colorIndex]
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  async function sendMessage (obj) {
    if (!connection) {
      console.log('must be connected.')
    } else {
      const message = connection.createDataStream()
      await new Promise(resolve => {
        message.write(JSON.stringify(obj), () => {
          message.end()
          resolve()
        })
      })
    }
  }

  async function handleData (data) {
    const json = JSON.parse(data.toString('utf8'))
    switch (json.type) {
      case 'privmsg':
        readline.cursorTo(process.stdout, 0, null)
        readline.clearLine(process.stdout, 0)
        console.log(color(json.nick)(json.nick + ': ') + json.message)
        rl.prompt()
        return
      default:
        return
    }
  }

  rl.on('line', async cmd => {
    const linesToClear = cmd.length / process.stdout.columns
    for (let i = 0; i < linesToClear; ++i) {
      readline.moveCursor(process.stdout, 0, -1)
      readline.clearLine(process.stdout, 0)
    }

    if (cmd.startsWith('/connect')) {
      const [, endpoint ] = cmd.split(' ')
      const { destinationAccount, sharedSecret } = await SPSP.query(endpoint)

      console.log(chalk.grey('connecting...'))
      connection = await IlpStream.createConnection({
        plugin,
        destinationAccount,
        sharedSecret: Buffer.from(sharedSecret, 'base64')
      })
      connection.on('data_stream', stream => {
        stream.on('data', handleData)
      })
      connection.on('close', () => {
        console.log(chalk.grey('connection closed.'))
        connection = null
      })
      console.log(chalk.grey('connected'))
    } else if (cmd.startsWith('/nick')) {
      const [, nick ] = cmd.split(' ')
      await sendMessage({ type: 'nick', nick })
      console.log(chalk.grey('set nick to ') + color(nick)(nick))
    } else if (!cmd.startsWith('/')) {
      await sendMessage({ type: 'privmsg', message: cmd, channel: '#global' })
    }

    rl.prompt()
  })

  rl.setPrompt('>> ')
  rl.prompt()
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
