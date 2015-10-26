module.exports=inject;

function inject(serv,player)
{

  player.on("connected",() => serv.log("[INFO]: " + player.username + ' connected'));

  player.on("spawned",() => serv.log("[INFO]: position written, player spawning..."));

  player.on("disconnected",() => serv.log("[INFO]: " + player.username + ' disconnected'));

  player.on("chat", message => serv.log("[INFO] " + '<' + player.username + '>' + ' ' + message));

  player.on("kicked",(kicker,reason) =>
    serv.log(kicker.username + " kicked " + player.username + (reason ? " (" + reason + ")" : "")));

}