module.exports = (obj) => {
  return async (eventName, data, func, cancelFunc) => {
    var hiddenCancelled = false;
    var cancelled = false;
    var cancelCount = 0;
    var defaultCancel = true;
    var cancel = (dC=true, hidden=false) => { // Hidden shouldn't be used often but it's not hard to implement so meh
      if (hidden) hiddenCancelled = true;
      else {
        cancelled = true;
        cancelCount++;
      }
      defaultCancel = dC;
    };
    
    var resp;

    await obj.emitThen(eventName + '_cancel', data, cancel).catch((err)=> setTimeout(() => {throw err;},0));
    await obj.emitThen(eventName, data, cancelled, cancelCount).catch((err)=> setTimeout(() => {throw err;},0));

    if (!hiddenCancelled && !cancelled) {
      resp = await func(data).catch((err)=> setTimeout(() => {throw err;},0));
      if (typeof resp == 'undefined') resp = true;
    } else if (cancelFunc && defaultCancel) {
      resp = await cancelFunc(data).catch((err)=> setTimeout(() => {throw err;},0));
      if (typeof resp == 'undefined') resp = false;
    }

    await obj.emitThen(eventName + '_done', data, cancelled).catch((err)=> setTimeout(() => {throw err;},0));
    return resp;
  }
};