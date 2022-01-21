module.exports.player = async function (player, serv, settings) {
    function warn(promise){
        serv.warn('-------------------------------')
        serv.warn('Please report this flying-squid! This is bug (mabye)')
        serv.warn('Unhandled rejection warning!');
        serv.warn('Error: ' + promise)
        serv.warn('-------------------------------')
        player.chat("§cAn error happend in flying-squid's code. Please report it to flying-squid")
        player.chat("§cError: " + promise)
    }
    process.on('unhandledRejection', (promise) => {
        warn(promise)
    })
    function error(err){
        serv.err('-------------------------------')
        serv.err('Please report this flying-squid! This is bug (mabye)')
        serv.err('Uncaught exception! Something went wrong!');
        serv.err('Error (short error message): ' + err)
        serv.err('Error (full error message): ' + err.stack)
        serv.err('-------------------------------')
        player.chat("§cAn error happend in flying-squid's code. Please report it to flying-squid")
        player.chat("§cError: " + err)
    }
    process.on('uncaughtException', err => {
        error(err)
    });
}
