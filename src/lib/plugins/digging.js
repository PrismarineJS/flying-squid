var Vec3 = require("vec3");

module.exports.player=function(player,serv)
{
  player._client.on("block_dig",({location,status} = {}) => {
    var pos=new Vec3(location);
    player.world.getBlock(pos)
      .then(block => {
        currentlyDugBlock=block;
        if(currentlyDugBlock.type==0) return;
        if(status==0 && player.gameMode!=1)
          startDigging(pos);
        else if(status==2)
          completeDigging(pos);
        else if(status==1)
          cancelDigging(pos);
        else if(status==0 && player.gameMode==1)
          creativeDigging(pos);
      })
    .catch((err)=> setTimeout(() => {throw err;},0));
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
        lastDestroyState=newDestroyState;
        player._writeOthersNearby("block_break_animation",{
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
    player._writeOthersNearby("block_break_animation",{
      "entityId":currentAnimationId,
      "location":location,
      "destroyStage":-1
    });
  }

  async function completeDigging(location)
  {
    clearInterval(animationInterval);
    var diggingTime=new Date()-startDiggingTime;
    if(expectedDiggingTime-diggingTime<100) {
      player.changeBlock(location,0,0);
      // Drop block
      serv.spawnObject(2, player.world, location.offset(0.5, 0.5, 0.5), {
        velocity: Vec3(Math.random()*4 - 2, Math.random()*2 + 2, Math.random()*4 - 2),
        itemId: currentlyDugBlock.type,
        itemDamage: currentlyDugBlock.metadata
      });
    }
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
    return player.changeBlock(location,0,0);
  }

};