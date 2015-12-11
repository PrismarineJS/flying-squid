class Command {
  constructor(params, parent, hash) {
    this.params = params;
    this.parent = parent;
    this.hash = parent ? parent.hash : {};
    this.uniqueHash = parent ? parent.uniqueHash : {};
    this.parentBase = (this.parent && this.parent.base && this.parent.base + ' ') || '';
    this.base = this.parentBase + (this.params.base || '');

    if(this.params.base) this.updateHistory();
  }

  find(command) {
    var parts=command.split(" ");
    var c=parts.shift();
    var pars=parts.join(" ");
    if(this.hash[c])
      return [this.hash[c], pars];
    return undefined;
  }

  async use(command, op=true) {
    var res = this.find(command);

    if(res) {
      var [com,pars]=res;
      if (com.params.op && !op) return 'You do not have permission to use this command';
      var parse = com.params.parse;
      if(parse) {
        if(typeof parse == 'function') {
          pars = parse(pars);
          if(pars === false) {
            return com.params.usage ? 'Usage: ' + com.params.usage : 'Bad syntax';
          }
        } else {
          pars = pars.match(parse);
        }
      }
      
      var val = res[0].params.action(res[1])
      if (val && val.catch) res = await val.catch((err)=> setTimeout(() => {throw err;},0));
      else res = val;

      if(res) return '' + res;
    } else {
      return 'Command not found';
    }
  }

  updateHistory() {
    var all = '(.+?)';

    var list = [this.base];
    if(this.params.aliases && this.params.aliases.length) {
      this.params.aliases.forEach(al => list.unshift(this.parentBase + al));
    }

    list.forEach((command) => {
      var parentBase = this.parent ? (this.parent.path || '') : '';
      this.path = parentBase + this.space() + (command || all);
      if(this.path == all && !this.parent) this.path = '';

      if(this.path) this.hash[this.path] = this;
    });
    this.uniqueHash[this.base] = this;
  }

  add(params) {
    return new Command(params, this);
  }

  space(end) {
    var first = !(this.parent && this.parent.parent);
    return this.params.merged || (!end && first) ? '' : ' ';
  }

  setOp(op) {
    this.params.op = op;
  }
}

module.exports=Command;