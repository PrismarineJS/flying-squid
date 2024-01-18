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
    /** @internal */
    tickInterval: any
    /** Total number of ticks that have passed since the start of the world.
     * Best to use with modulo (e.g. Something every 10 seconds is `serv.tickCount % 20*10 === 0`)
     */
    'tickCount': number
    /** @internal */
    'lastTickTime': number
    /** Resets tick interval to occur `ticksPerSecond` times per second.
     *
     * Use `server.stopTickInterval()` if you want but this method already calls that and you can use `serv.doDaylightCycle` to stop it anyway.
     */
    'setTickInterval': (ticksPerSecond: any) => void
    /** @internal */
    "stopTickInterval": () => void
  }
}
