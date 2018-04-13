class Stream {
  constructor (deps) {
  }

  read (stream) {
    let money = 0
    let data = Buffer.alloc(0)

    stream.setReceiveMax(Infinity)

    return new Promise((resolve) => {
      stream.on('money', amount => money += Number(amount))
      stream.on('data', chunk => data = Buffer.concat([ data, chunk ]))
      stream.on('end', () => {
        resolve({ data, money })
      })
    })
  }

  async writeJSON ({ connection, message, money }) {
    return this.write({
      connection,
      money,
      data: Buffer.from(JSON.stringify(message))
    })
  }

  async write ({ connection, money, data }) {
    const stream = connection.createStream()

    await new Promise(async resolve => {
      if (money) {
        await stream.sendTotal(money)
      }

      stream.write(data)
      stream.end()
      stream.on('finish', () => {
        resolve()
      })
    })
  }
}

module.exports = Stream
