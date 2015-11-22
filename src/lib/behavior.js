module.exports = (obj) => {
  return async (eventName, data, func, opt) => {
    var hiddenCancelled = false;
    var cancelled = false;
    var cancelCount = 0;
    var cancel = (hidden) => { // Hidden shouldn't be used often but it's not hard to implement so meh
      if (hidden) hiddenCancelled = true;
      else {
        cancelled = true;
        cancelCount++;
      }
    }
    
    await obj.emit(eventName + '_cancel', data, cancel);
    await obj.emit(eventName, data, cancelled, cancelCount);

    if (!hiddenCancelled && !cancelled) await func(data);

    await obj.emit(eventName + '_done', data, cancelled);
  }
}