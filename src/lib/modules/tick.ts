export const server = function (serv: Server) {
  serv.tickCount = 0
  serv.lastTickTime = 0

  serv.setTickInterval = ticksPerSecond => {
    serv.stopTickInterval()

    serv.tickInterval = setInterval(() => {
      serv.tickCount++
      const t = Date.now()
      let time = (t - serv.lastTickTime) / 1000
      if (time > 100) time = 0
      serv.emit('tick', time, serv.tickCount)
      serv.lastTickTime = t
    }, 1000 / ticksPerSecond)
  }

  serv.stopTickInterval = () => {
    if (serv.tickInterval) clearInterval(serv.tickInterval)
    serv.tickInterval = null
  }

  serv.setTickInterval(20)
}
declare global {
  interface Server {
    tickInterval: any
    "tickCount": number
    "lastTickTime": number
    "setTickInterval": (ticksPerSecond: any) => void
    "stopTickInterval": () => void
  }
}
