class Stream {
  constructor (deps) {
  }

  read (stream) {
    let money = 0
    let data = Buffer.alloc(0)

    return new Promise((resolve) => {
      stream.on('money', amount => money += Number(amount))
      stream.on('data', chunk => data = Buffer.concat([ data, chunk ]))
      stream.on('end', () => {
        resolve({ data, money })
      })
    })
  }

  async writeJSON ({ connection, message }) {
    return this.write({
      connection,
      data: Buffer.from(JSON.stringify(message))
    })
  }

  async write ({ connection, data }) {
    const stream = connection.createStream()

    await new Promise(resolve => {
      stream.write(data, () => {
        stream.end()
        resolve()
      })
    })
  }
}

module.exports = Stream
