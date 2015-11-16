module.exports.server=function(serv)
{
  serv.entityMaxId=0;
  serv.players=[];
  serv.uuidToPlayer={};
  serv.entities={};

  serv.getPlayer = username => {
    for (var p in serv.players) {
      if (serv.players[p].username == username) return serv.players[p]
    }
    return null;
  };
};

module.exports.player=function(player){
  player.commands.add({
    base: 'gamemode',
    aliases: ['gm'],
    info: 'to change game mode',
    usage: '/gamemode <0-3>',
    parse(str) {
      var results;
      if(!(results = str.match(/^([0-3])$/)))
        return false;
      return parseInt(str);
    },
    action(mode) {
      player.setGameMode(mode);
    }
  });
};