const IlpStream = require('ilp-protocol-stream')
const stripAnsi = require('strip-ansi')
const makePlugin = require('ilp-plugin')
const crypto = require('crypto')

const User = require('./user')
const Stream = require('../common/stream')

class Receiver {
  constructor (deps) {
    this._plugin = makePlugin()
    this._server = null
    this._connected = false

    this._users = deps(User)
    this._stream = deps(Stream)
  }

  generateAddressAndSecret () {
    return this._server.generateAddressAndSecret()
  }

  async init () {
    if (this._connected) return
    this._connected = true

    await this._plugin.connect()

    this._server = new IlpStream.Server({
      plugin: this._plugin,
      serverSecret: crypto.randomBytes(32)
    })

    this._server.on('connection', connection => {
      const userId = this._setup({ connection })
      connection.on('stream', async stream => {
        const { money, data } = await this._stream.read(stream)
        const message = await this._handle({ money, data, userId })
        await this._stream.writeJSON({ connection, message })
      })
    })

    await this._server.listen()
  }

  _setup ({ connection }) {
    const userId = this._users.add({ connection })

    console.log('subscribing #global. userId=' + userId)
    this._users.joinChannel({ userId, channel: '#global' })

    return userId
  }

  async _handleNick ({ money, json, userId }) {
    this._users.setNick({ 
      userId,
      nick: json.nick,
      password: json.password
    })
    console.log('set nick.' +
      ' nick=' + json.nick +
      ' userId=' + userId)
  }

  async _handlePrivmsg ({ money, json, userId }) {
    const { nick } = this._users.get(userId)
    if (!nick) {  
      throw new Error('user must have nick.')
    }
    const users = this._users.getChannelUsers(json.channel)
    const message = {
      type: 'privmsg',
      nick,
      channel: json.channel,
      message: json.message
    }
    await this._broadcast({ users, message })
    console.log('privmsg.' +
      ' channel=' + json.channel +
      ' message=' + json.message +
      ' userId=' + userId)
  }

  async _handlePay ({ money, json, userId }) {
    const { nick } = this._users.get(userId)
    if (!nick) {
      throw new Error('user must have nick.')
    }
    if (!money) {
      throw new Error('no money was sent with "pay".')
    }
    const users = this._users.getChannelUsers(json.channel)
    const message = {
      type: 'pay',
      nick,
      payee: json.payee,
      channel: json.channel,
      money
    }

    const broadcastUsers = users.filter(u => this._users.get(u).nick !== json.payee)
    await this._broadcast({ users: broadcastUsers, message })

    const payeeUserId = this._users.getByNick(json.payee)
    if (!payeeUserId) {
      throw new Error('no user with nick "' + json.payee + '"')
    }

    await this._broadcast({ users: [ payeeUserId ], message, money })
  }

  async _handle ({ money, data, userId }) {
    const text = data.toString('utf8')
    const json = JSON.parse(stripAnsi(text))

    try {
      switch (json.type) {
        case 'nick':
          await this._handleNick({ money, json, userId })
          break

        case 'privmsg':
          await this._handlePrivmsg({ money, json, userId })
          break

        case 'pay':
          await this._handlePay({ money, json, userId })
          break
      }

      return {
        id: json.id,
        type: 'success'
      }
    } catch (e) {
      console.log('error handling message.' +
        ' userId=' + userId +
        ' error=', e)
      return {
        id: json.id,
        type: 'error',
        error: e.message,
        stack: e.stack
      }
    }
  }

  async _broadcast ({ users, message, money }) {
    const share = Math.floor(money / users.length)
    return Promise.all(users.map(async userId => {
      const { connection } = this._users.get(userId)

      try {
        console.log('writing to stream. userId=' + userId)
        await this._stream.writeJSON({ connection, message, money: share })
      } catch (e) {
        console.error('failed to send to user.' +
          ' userId=' + userId +
          ' error=', e)
      }
    }))
  }
}

module.exports = Receiver
