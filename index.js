const IlpStream = require('ilp-protocol-stream')
const makePlugin = require('ilp-plugin')
const crypto = require('crypto')
const plugin = makePlugin()

async function run () {
  await plugin.connect()

  const server = new IlpStream.Server({ plugin, serverSecret: crypto.randomBytes(32) })
  const nicks = new Map()
  const channels = new Map()

  function subscribe (userContext, channel) {
    if (!channels.get(channel)) {
      channels.set(channel, [])
    }

    channels.get(channel).push(userContext)
  }

  async function broadcast (json) {
    subscribers = channels.get(json.channel)
    for (const subscriber of subscribers) {
      const stream = subscriber.connection.createDataStream()
      await new Promise(resolve => {
        stream.write(JSON.stringify(json), () => {
          stream.end()
          resolve()
        })
      })
    }
  }

  async function handleMessage (userContext, json) {
    console.log('got command.', json)
    switch (json.type) {
      case 'nick':
        if (userContext.nick) return
        if (!json.nick.match(/[A-Za-z0-9]+/)) return
        if (nicks.get(json.nick)) return
        userContext.nick = json.nick
        nicks.set(json.nick, userContext)
        console.log('registered nickname. nick=' + json.nick)
        return
      case 'privmsg':
        if (!userContext.nick) return
        console.log('message. nick="' + userContext.nick +
          '" channel="' + json.channel +
          '" message="' + json.message + '"')
        await broadcast(Object.assign({ nick: userContext.nick }, json))
        return
      default:
        return
    }
  }

  server.on('connection', connection => {
    console.log('got connection')
    let userContext = { connection }

    subscribe(userContext, '#global')

    connection.on('data_stream', stream => {
      stream.on('data', chunk => {
        handleMessage(userContext, JSON.parse(chunk.toString('utf8')))
        stream.removeAllListeners('data')
        stream.end()
      })
      /*
      let data = Buffer.alloc(0)
      stream.on('data', chunk => {
        console.log('chunk. chunk="' + chunk.toString('utf8') + '"')
        data = Buffer.concat([ data, chunk ])
        setImmediate(() => stream.end())
      })
      stream.on('end', () => {
        console.log('parsing. data="' + data.toString('utf8') + '"')
        handleMessage(userContext, JSON.parse(data.toString('utf8')))
      })
      */
    })

    connection.on('close', () => {
      console.log('connection closed.')
      if (userContext.nick) nicks.delete(userContext.nick)
    })
  })

  await server.listen()

  let details = server.generateAddressAndSecret()
  console.log('/connect', details.destinationAccount, details.sharedSecret.toString('base64'))
  details = server.generateAddressAndSecret()
  console.log('/connect', details.destinationAccount, details.sharedSecret.toString('base64'))
  details = server.generateAddressAndSecret()
  console.log('/connect', details.destinationAccount, details.sharedSecret.toString('base64'))
  details = server.generateAddressAndSecret()
  console.log('/connect', details.destinationAccount, details.sharedSecret.toString('base64'))
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
