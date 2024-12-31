const { emitAsync } = require('./utils')
module.exports = function createBehavior (entity) {
  return async function (eventName, data, onSuccess, onCancel) {
    let isCancelled = false
    let runOnCancelCb = true
    let hideCancel = false
    let cancelCount = 0
    function cancel (triggerCancelBehavior = true, hideFromPlugins = false) {
      runOnCancelCb = triggerCancelBehavior
      hideCancel = hideFromPlugins
      isCancelled = true
      cancelCount++
    }
    await emitAsync(entity, `${eventName}_cancel`, data, cancel)
    await emitAsync(entity, `${eventName}`, data, hideCancel ? false : isCancelled, hideCancel ? 0 : cancelCount)
    let resp = false
    if (isCancelled) {
      if (runOnCancelCb) {
        resp = await onCancel?.(data)
      }
    } else {
      resp = await onSuccess?.(data)
      resp ??= true
    }
    await emitAsync(entity, `${eventName}_done`, data, hideCancel ? false : isCancelled)
    return resp
  }
}
