const makePlugin = require('ilp-plugin')
const uuid = require('uuid')
const IlpStream = require('ilp-protocol-stream')
const SPSP = require('ilp-protocol-spsp')
const Render = require('./render')
const Stream = require('../common/stream')
const EventEmitter = require('events')

class Sender extends EventEmitter {
  constructor (deps) {
    super()

    this.render = deps(Render)
    this.stream = deps(Stream)
    this.plugin = makePlugin()
    this.connection = null
  }

  async connect (endpoint) {
    const { destinationAccount, sharedSecret } = await SPSP.query(endpoint)

    this.render.printInfo('connecting...')

    await this.plugin.connect()

    this.connection = await IlpStream.createConnection({
      plugin: this.plugin,
      destinationAccount,
      sharedSecret: Buffer.from(sharedSecret, 'base64')
    })

    this.connection.on('stream', async stream => {
      const { money, data } = await this.stream.read(stream)
      this.handle({ money, data })
    })

    this.render.printInfo('connected')
  }

  async handle ({ money, data }) {
    const text = data.toString('utf8')
    const json = JSON.parse(text)

    if (json.id) {
      this.emit('_' + json.id, json)
      return
    }

    this.render.printNotification(json)
  }

  async call (message) {
    if (!this.connection) {
      return { type: 'error', error: 'you are not connected.' }
    }

    const id = uuid()
    await this.stream.writeJSON({
      connection: this.connection,
      message: Object.assign({ id }, message)
    })

    return new Promise(resolve => {
      this.once('_' + id, resolve)
    })
  }
}

module.exports = Sender
