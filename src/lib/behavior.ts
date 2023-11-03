export default (obj) => {
  return async (eventName: string, data?: any, func?: Function, cancelFunc?: Function) => {
    let hiddenCancelled = false
    let cancelled = false
    let cancelCount = 0
    let defaultCancel = true
    const cancel = (dC = true, hidden = false) => { // Hidden shouldn't be used often but it's not hard to implement so meh
      if (hidden) hiddenCancelled = true
      else {
        cancelled = true
        cancelCount++
      }
      defaultCancel = dC
    }

    let resp

    func = func || (() => { })

    await obj.emitThen(eventName + '_cancel', data, cancel).catch((err) => setTimeout(() => { throw err }, 0))
    await obj.emitThen(eventName, data, cancelled, cancelCount).catch((err) => setTimeout(() => { throw err }, 0))

    if (!hiddenCancelled && !cancelled) {
      resp = func(data)
      if (resp instanceof Promise) resp = await resp.catch((err) => setTimeout(() => { throw err }, 0))
      if (typeof resp === 'undefined') resp = true
    } else if (cancelFunc && defaultCancel) {
      resp = cancelFunc(data)
      if (resp instanceof Promise) resp = await resp.catch((err) => setTimeout(() => { throw err }, 0))
      if (typeof resp === 'undefined') resp = false
    }
    await obj.emitThen(eventName + '_done', data, cancelled).catch((err) => setTimeout(() => { throw err }, 0))

    return resp
  }
}
