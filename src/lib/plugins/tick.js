module.exports.server=function(serv) {
  serv.tickCount = 0;
  serv.lastTickTime = Date.now();

  serv.scheduledTicks = [];
  serv.currentTick = [];
  serv.processingTick = false;


  serv.setTickInterval = ticksPerSecond => {
    serv.stopTickInterval();

    serv.tickInterval = setInterval(() => {
      
      var t=Date.now();
      var time = (t - serv.lastTickTime) / 1000;
      serv.tick(time, 1);
      serv.lastTickTime = t;
    }, 1000/ticksPerSecond);
  };

  serv.stopTickInterval = () => {
    if (serv.tickInterval) clearInterval(serv.tickInterval);
    serv.tickInterval = null;
  };

  serv.tick = async (time, amt) => {
    while(amt > 0) {
      amt--;
      serv.tickCount++;
      serv.processingTick = true;
      serv.prepareScheduledTicks();
      await serv.emitThen('tick', time, serv.tickCount);
      await serv.emitThen('tick_done', time, serv.tickCount);
      this.currentTick = [];
      serv.processingTick = false;
    }
  };

  serv.prepareScheduledTicks = () => {
    var thisTick = [];
    serv.scheduledTicks.forEach((t, index) => {
      t.ticks--;
      if (t.ticks <= 0) thisTick.push({ id: index - thisTick.length, action: t });
    });
    thisTick.forEach(t => serv.scheduledTicks.splice(t.id, 1));
    serv.currentTick = serv.currentTick.concat(thisTick.map(t => t.action));
  };

  function findInArray(item, arr) {
    var ind = -1;
    arr.forEach((a, index) => {
      if (ind != -1) return;
      var success = true;
      Object.keys(item).forEach(key => {
        if (a[key] != item[key]) success = false;
      });
      if (success) ind = index;
    });
    return ind;
  }

  serv.newAction = ({type,position,world}, time=0) => {
    var data = {
      type: type,
      position: position,
      world: world,
      ticks: time + (serv.processingTick ? 0 : 1)
    };
    //console.log('newAction',position);
    if (time > 0) {
      var exists = findInArray({ world: world, position: position}, serv.scheduledTicks) != -1;
      if (exists) return;
      serv.scheduledTicks.push(data);
    } else {
      var exists = findInArray({ world: world, position: position}, serv.currentTick) != -1;
      if (exists) return;
      serv.currentTick.push(data);
    }
  };


  serv.setTickInterval(20);
};

