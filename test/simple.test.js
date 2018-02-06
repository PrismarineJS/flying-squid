const net = require('net')
const squid = require('flying-squid')

describe('server', () => {
  let server

  beforeAll(done => {
    server = squid.createMCServer({ logging: false })

    server.on('listening', () => {
      done()
    })
  })

  afterAll(done => {
    server._server.close()
    server._server.on('close', () => {
      done()
    })
  })

  test('is running', done => {
    const client = net.Socket()
    client.connect(server._server.socketServer.address().port, '127.0.0.1', done)
    client.on('error', done)
  })
})
