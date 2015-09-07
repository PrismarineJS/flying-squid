var Vec3 = require("vec3");
var cancelEmit = require("../cancelEvent");

module.exports=inject;

function inject(serv,player)
{
  player._client.on("block_dig",function(packet){
    var pos=new Vec3(packet.location);
    
    var doDefault = cancelEmit(player, "startDig", {
        position: pos,
        block: serv.world.getBlock(pos)
    });
    if (!doDefault) return;
    
    currentlyDugBlock=serv.world.getBlock(pos);
    if(currentlyDugBlock.type==0) return;
    if(packet.status==0 && player.gameMode!=1)
      startDigging(pos);
    else if(packet.status==2)
      completeDigging(pos);
    else if(packet.status==1)
      cancelDigging(pos);
    else if(packet.status==0 && player.gameMode==1)
      creativeDigging(pos);
  });

  function diggingTime(location)
  {
    // assume holding nothing and usual conditions
    return currentlyDugBlock.digTime();
  }

  var currentlyDugBlock;
  var startDiggingTime;
  var animationInterval;
  var expectedDiggingTime;
  var lastDestroyState;
  var currentAnimationId;
  function startDigging(location)
  {
    serv.entityMaxId++;
    currentAnimationId=serv.entityMaxId;
    expectedDiggingTime=diggingTime(location);
    lastDestroyState=0;
    startDiggingTime=new Date();
    updateAnimation();
    animationInterval=setInterval(updateAnimation,100);
    function updateAnimation()
    {
      var currentDiggingTime=new Date()-startDiggingTime;
      var newDestroyState=Math.floor(9*currentDiggingTime/expectedDiggingTime);
      newDestroyState=newDestroyState>9 ? 9 : newDestroyState;
      if(newDestroyState!=lastDestroyState)
      {
        var doDefault = cancelEmit(player, "breakAnimation", {
            lastState: lastDestroyState,
            position: location,
            block: currentlyDugBlock
        });
        if (!doDefault) return;
        
        lastDestroyState=newDestroyState;
        player._writeOthers("block_break_animation",{
          "entityId":currentAnimationId,
          "location":location,
          "destroyStage":newDestroyState
        });
      }
    }
  }

  function cancelDigging(location)
  {
    clearInterval(animationInterval);
    
    var doDefault = cancelEmit(player, "stopDig", {
        position: pos,
        block: serv.world.getBlock(pos)
    });
    if (!doDefault) return;
    
    player._writeOthers("block_break_animation",{
      "entityId":currentAnimationId,
      "location":location,
      "destroyStage":-1
    });
  }

  function completeDigging(location)
  {
    clearInterval(animationInterval);
    var diggingTime=new Date()-startDiggingTime;
    if(expectedDiggingTime-diggingTime<100)
      var doDefault = cancelEmit(player, "finishDig", {
          time: diggingTime,
          position: pos,
          block: serv.world.getBlock(pos)
      });
      if (!doDefault) return;
      player.changeBlock(location,0);
    else
    {
      player._client.write("block_change",{
        location:location,
        type:currentlyDugBlock.type<<4
      });
    }
  }


  function creativeDigging(location)
  {
    var doDefault = cancelEmit(player, "finishDig", {
        time: 0,
        position: pos,
        block: serv.world.getBlock(pos)
    });
    player.changeBlock(location,0);
  }

}