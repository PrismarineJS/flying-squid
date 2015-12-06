class Command {
  constructor(params, parent, hash) {
    this.params = params;
    this.parent = parent;
    this.hash = parent ? parent.hash : {};

    this.updateHistory();
  }

  find(command) {
    var res;
    for(var key in this.hash) {
      var space = this.hash[key].space(true);
      if(space) space += '?';

      var ended = space + '(.*)';

      var found = command.match(new RegExp('^' + key + ended));
      if(found) {
        res = [this.hash[key], found];
      }
    }

    return res;
  }

  async use(command, op=true) {
    var res = this.find(command);

    if(res) {
      if (res[0].params.op && !op) return 'You do not have permission to use this command';
      var parse = res[0].params.parse;
      if(parse) {
        if(typeof parse == 'function') {
          res[1] = parse(res[1][1]);
          if(res[1] === false) {
            return res[0].params.usage ? 'Usage: ' + res[0].params.usage : 'Bad syntax';
          }
        } else {
          res[1] = res[1][1].match(parse);
        }
      } else {
        res[1].shift();
      }

      res = await res[0].params.action(res[1]);
      if(res) return '' + res;
    } else {
      return 'Command not found';
    }
  }

  updateHistory() {
    var all = '(.+?)';

    var list = [this.params.base];
    if(this.params.aliases && this.params.aliases.length) {
      this.params.aliases.forEach(al => list.unshift(al));
    }

    list.forEach((command) => {
      var parentBase = this.parent ? (this.parent.path || '') : '';
      this.path = parentBase + this.space() + (command || all);
      if(this.path == all && !this.parent) this.path = '';

      if(this.path) this.hash[this.path] = this;
    });
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