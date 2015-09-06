module.exports=inject;

function inject(serv,player)
{

  player.on("connected",function(){
    console.log("[INFO]: " + player.username + ' connected');
    serv.log("[INFO]: " + player.username + ' connected');
  });

  player.on("spawned",function(){
    console.log("[INFO]: position written, player spawning...");
    serv.log("[INFO]: position written, player spawning...");
  });

  player.on("disconnected",function(){
    console.log("[INFO]: " + player.username + ' disconnected');
    serv.log("[INFO]: " + player.username + ' disconnected');
  });

  player.on("error",function(error){
    console.log('[ERR] ' + error.stack);
    serv.log('[ERR]: Client: ' + error.stack);
  });

  player.on("chat",function(message){
    message = '<' + player.username + '>' + ' ' + message;
    console.log("[INFO] " + message);
    serv.log("[INFO] " + message);
  });

}