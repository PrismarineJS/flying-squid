
module.exports.player = function(player, serv) { // Player is a type of entity (entity inject is called first) with added properties and functions
  player.commands.add({
    base: 'weather',
    info: 'Sets ths weather.',
    usage: '/weather <clear|rain|thunder> [duration]',
    op: true,
    parse(str) {
      const args = str.split(' ');
      if(args.length!=2)
        return false;

      let condition = player.selectorString(args[0]);
      if(condition.length==0) throw new UserError("one condition");

      let duration = player.selectorString(args[1]);
      if(duration.length < 1) throw new UserError("one duration");

      return {condition:condition[0],duration:duration[0]};
    },
    action({condition,duration}){
      if(condition == 'rain'){
        serv._writeAll('game_state_change',{reason:2,value:0});
      } else if(condition == 'clear') {
        serv._writeAll('game_state_change',{reason:1,value:0});
      }
    }
  })
};
