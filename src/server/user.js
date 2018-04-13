const uuid = require('uuid')

class User {
  constructor () {
    this._users = new Map()
    this._nicks = new Map()
    this._channels = new Map()
  }

  add ({ connection }) {
    const userId = uuid()
    this._users.set(userId, { connection })
    return userId
  }

  get (userId) {
    return this._users.get(userId)    
  }

  getByNick (nick) {
    return this._nicks.get(nick).userId
  }

  // TODO: delete users

  setNick ({ userId, nick, password }) {
    if (nick.startsWith('#')) {
      throw new Error('only channels may start with "#". nick=' + nick)
    }

    const existing = this._nicks.get(nick)
    if (existing && (!existing.password || existing.password !== password)) {
      throw new Error('nick is already taken. nick=' + nick) 
    }

    this._nicks.set(nick, { userId, password })
    this._users.get(userId).nick = nick
  }

  joinChannel ({ userId, channel }) {
    if (!channel.startsWith('#')) {
      throw new Error('channels must start with "#". channel=' + channel)
    }

    if (!this._channels.get(channel)) {
      this._channels.set(channel, new Array())
    }

    this._channels.get(channel).push(userId)
    console.log(this._channels.get(channel))
  }

  getChannelUsers (channel) {
    if (this._nicks.get(channel)) {
      return [ this._nicks.get(channel).userId ]
    }

    if (!this._channels.get(channel)) {
      this._channels.set(channel, new Array())
    }

    return this._channels.get(channel)
  }
}

module.exports = User
