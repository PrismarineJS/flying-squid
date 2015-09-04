module.exports = emit;

function emit(target, eventName, args, defaultFunc) {
    var hiddenCancelled = false;
    var cancelled = false;
    var cancel = function(hidden) { // Hidden shouldn't be used often but it's not hard to implement so meh
        if (hidden) hiddenCancelled = true;
        else cancelled = true;
    }
    
    target.emit(eventName + '_cancel', args, cancel);
    
    target.emit(eventName, args, cancelled);
    
    if (!hiddenCancelled && !cancelled) {
        if (defaultFunc) defaultFunc();
        return true;
    } else {
        return false
    }
}