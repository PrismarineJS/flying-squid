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
    }
    
    await obj.emit(eventName + '_cancel', data, cancel);
    await obj.emit(eventName, data, cancelled, cancelCount);

    if (!hiddenCancelled && !cancelled) await func(data);
    else if (cancelFunc && defaultCancel) cancelFunc(data);

    await obj.emit(eventName + '_done', data, cancelled);
  }
}