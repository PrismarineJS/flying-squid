var playersonline = 0

module.exports.player = async function (player, serv, settings) {
    serv.info('[debug] Max players: ' + settings['max-players'])
    player.on('connected', () => {
        if(playersonline > settings['max-players']){
            player.kick('The server is full')
        }
        playersonline++
        serv.info('[debug] Players online: ' + playersonline)
    })
    player.on('disconnected', () => {
        playersonline--
        serv.info('[debug] Players online: ' + playersonline)
    })
}
