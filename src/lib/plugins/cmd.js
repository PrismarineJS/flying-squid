const EventEmitter = require('events');
const Command = require('flying-squid').Command

function stdinLineByLine() {
  const stdin = new EventEmitter();
  let buff = "";

  process.stdin
    .on('data', data => {
      buff += data;
      lines = buff.split(/[\r\n|\n]/);
      buff = lines.pop();
      lines.forEach(line => {
        if (line !== '') {
            stdin.emit('line', line)
        }
      });
    })
    .on('end', () => {
      if (buff.length > 0) stdin.emit('line', buff);
    });

  return stdin;
}

const stdin = stdinLineByLine();

module.exports.server = function (serv) {
  serv.handleCommand = async (str) => {
      try {
        const res = await serv.commands.use(str)
        if (res) serv.log("[INFO]: " + res)
      } catch (err) {
        if (err.userError) serv.log('[ERR]: ' + err.message)
        else setTimeout(() => { throw err }, 0)
      }
    }

  stdin.on('line', (data) => {
    serv.handleCommand(data)
  });
}

module.exports.player = function (player, serv) {
    
}