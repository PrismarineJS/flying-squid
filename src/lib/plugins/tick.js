module.exports.server=function(serv) {
  serv.tickCount = 0;
  serv.lastTickTime = Date.now();

  serv.scheduledTicks = [];
  serv.currentTick = [];


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
      serv.prepareScheduledTicks();
      await serv.emitThen('tick', time, serv.tickCount);
      await serv.emitThen('tick_done', time, serv.tickCount);
      this.currentTick = [];
    }
  };

  serv.prepareScheduledTicks = () => {
    var thisTick = [];
    serv.scheduledTicks.forEach((t, index) => {
      t.ticks--;
      if (t.ticks <= 0) thisTick.push({ id: index - thisTick.length, action: t });
    });
    thisTick.forEach(t => serv.scheduledTicks.splice(t.id, 1));
    serv.currentTick = thisTick.map(t => t.action);
  };

  serv.newAction = ({type,position,world}, time=0) => {
    var data = {
      type: type,
      position: position,
      world: world,
      ticks: time + 1
    };
    serv.scheduledTicks.push(data);
  };


  serv.setTickInterval(20);
};

