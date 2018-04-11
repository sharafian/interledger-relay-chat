const IlpStream = require('ilp-protocol-stream')
const plugin = require('ilp-plugin')()
const readline = require('readline')

async function run () {
  await plugin.connect()

  let connection = null

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  async function sendMessage (obj) {
    if (!connection) {
      console.log('must be connected.')
    } else {
      console.log('writing message.')
      const message = connection.createDataStream()
      await new Promise(resolve => {
        message.write(JSON.stringify(obj), () => {
          message.end()
          resolve()
        })
      })
      console.log('wrote message.')
    }
  }

  async function handleData (data) {
    const json = JSON.parse(data.toString('utf8'))
    switch (json.type) {
      case 'privmsg':
        console.log('\n' + json.nick + ': ' + json.message)
        return
      default:
        return
    }
  }

  rl.on('line', async cmd => {
    if (cmd.startsWith('/connect')) {
      const [, destinationAccount, sharedSecret ] = cmd.split(' ')
      console.log('connecting...')
      connection = await IlpStream.createConnection({
        plugin,
        destinationAccount,
        sharedSecret: Buffer.from(sharedSecret, 'base64')
      })
      connection.on('data_stream', stream => {
        stream.on('data', handleData)
      })
      connection.on('close', () => {
        console.log('connection closed.')
        connection = null
      })
      console.log('connected')
    } else if (cmd.startsWith('/nick')) {
      const [, nick ] = cmd.split(' ')
      await sendMessage({ type: 'nick', nick })
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
