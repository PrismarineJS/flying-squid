module.exports = (obj) => {
  return (eventName, data, func, opt) => {
    var hiddenCancelled = false;
    var cancelled = false;
    var cancel = (hidden) => { // Hidden shouldn't be used often but it's not hard to implement so meh
      if (hidden) hiddenCancelled = true;
      else cancelled = true;
    }
    obj.emit(eventName + '_cancel', data, cancel);
    obj.emit(eventName, data, cancelled);

    if (!hiddenCancelled && !cancelled) func(data);

    obj.emit(eventName + '_done', data, cancelled);
  }
}