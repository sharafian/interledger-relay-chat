const Koa = require('koa')
const Receiver = require('./receiver')

class SPSP {
  constructor (deps) {
    this._receiver = deps(Receiver)
    this._app = new Koa()
  }

  async init () {
    await this._receiver.init() 

    this._app.use(async (ctx, next) => {
      const { destinationAccount, sharedSecret } =
        this._receiver.generateAddressAndSecret()

      ctx.set('Content-Type', 'application/spsp+json')
      ctx.body = {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64') 
      }
    })

    const port = process.env.PORT || 6677
    this._app.listen(port)
    console.log('/connect http://localhost:' + port)
  }
}

module.exports = SPSP
