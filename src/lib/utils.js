// Emit and wait for the event to be handled by all listeners with Promise.all
function emitAsync (listener, event, ...args) {
  const listeners = listener.listeners(event)
  return Promise.all(listeners.map(listener => listener(...args)))
}

function onceWithTimeout (emitter, event, timeout = 10000, checkCondition) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for '${event}' event`))
    }, timeout)
    function onEvent (...data) {
      if (checkCondition && !checkCondition(...data)) return
      clearTimeout(timeoutId)
      resolve([...data])
      emitter.off(event, onEvent)
    }
    emitter.on(event, onEvent)
  })
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const skipMcPrefix = (name) => typeof name === 'string' ? name.replace(/^minecraft:/, '') : name

module.exports = {
  onceWithTimeout,
  skipMcPrefix,
  emitAsync,
  sleep
}
