module.exports=inject;

function inject(serv, player, self) {
    serv.broadcast('Hey ' + player.username + '!');
    player.setGameMode(1);
    
    player.on('block_place', function(e) {
        if (e.id == '5') {
            e.cancel();
            player.sendBlock(e.position, 0);
        }
    });
}