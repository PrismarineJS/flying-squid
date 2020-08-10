// INFO: this script dumps the latest constant dimension codec from the vanilla 1.16.1 server
const mc = require('minecraft-protocol')
const path = require('path')
const fs = require('fs')

const Wrap = require('minecraft-wrap').Wrap
const download = require('minecraft-wrap').download

const MC_SERVER_PATH = path.join(__dirname, 'server')
const MC_SERVER_JAR = `${MC_SERVER_PATH}/minecraft_server.jar`
const PORT = Math.round(30000 + Math.random() * 20000)
const wrap = new Wrap(MC_SERVER_JAR, MC_SERVER_PATH)
wrap.on('line', (line) => {
  console.debug(line)
})

download('1.16.1', MC_SERVER_JAR, (err) => {
  if (err) {
    console.error(err)
    return
  }
  wrap.startServer({ 'server-port': PORT, 'online-mode': false }, (err) => {
    if (err) return console.error(err)
    const client = mc.createClient({
      version: '1.16.1',
      username: 'dumper',
      host: '127.0.0.1',
      port: PORT
    })

    client.on('login', packet => {
      fs.writeFile('dimensionCodec.json', JSON.stringify(packet.dimensionCodec), (err) => {
        if (err) return console.error(err)
        console.log('Dumped dimension codec successfully to dimensionCodec.json!')
        client.end()
        wrap.stopServer(() => {
          wrap.deleteServerData(() => {})
        })
      })
    })
  })
})
