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

  // TODO: delete users

  setNick ({ userId, nick }) {
    if (nick.startsWith('#')) {
      throw new Error('only channels may start with "#". nick=' + nick)
    }

    if (this._nicks.get(nick)) {
      throw new Error('nick is already taken. nick=' + nick) 
    }

    this._nicks.set(nick, userId)
    this._users.get(userId).nick = nick
  }

  joinChannel ({ userId, channel }) {
    if (!channel.startsWith('#')) {
      throw new Error('channels must start with "#". channel=' + channel)
    }

    if (!this._channels.get(channel)) {
      this._channels.set(channel, new Set())
    }

    this._channels.get(channel).add(userId)
    console.log(this._channels.get(channel))
  }

  getChannelUsers (channel) {
    if (this._nicks.get(channel)) {
      return new Set([ this._nicks.get(channel) ])
    }

    if (!this._channels.get(channel)) {
      this._channels.set(channel, new Set())
    }

    return this._channels.get(channel)
  }
}

module.exports = User
