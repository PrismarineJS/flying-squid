module.exports=inject;

function inject(serv,player)
{

  player.on("connected",function(){
    serv.log("[INFO]: " + player.username + ' connected');
  });

  player.on("spawned",function(){
    serv.log("[INFO]: position written, player spawning...");
  });

  player.on("disconnected",function(){
    serv.log("[INFO]: " + player.username + ' disconnected');
  });

  player.on("error",function(error){
    serv.log('[ERR]: Client: ' + error.stack);
  });

  player.on("chat",function(message){
    message = '<' + player.username + '>' + ' ' + message;
    serv.log("[INFO] " + message);
  });

  player.on("kicked",function(kicker,reason){
    serv.log(kicker.username + " kicked " + player.username + (reason ? " (" + reason + ")" : ""));
  })

}