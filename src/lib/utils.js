// Emit and wait for the event to be handled by all listeners with Promise.all
function emitAsync (listener, event, ...args) {
  const listeners = listener.listeners(event)
  return Promise.all(listeners.map(listener => listener(...args)))
}

const skipMcPrefix = (name) => typeof name === 'string' ? name.replace(/^minecraft:/, '') : name

module.exports = {
  skipMcPrefix,
  emitAsync
}
