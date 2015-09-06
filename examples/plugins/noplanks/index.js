module.exports=inject;

function inject(serv, player, self) {
    serv.broadcast('Hey ' + player.username + '!');
    player.setGameMode(1);
    
    player.on('block_place_cancel', function(e, cancel) { // Users can't place any wood planks!
        if (e.id == '5') {
            cancel();
            player.sendBlock(e.position, 0);
        }
    });
}