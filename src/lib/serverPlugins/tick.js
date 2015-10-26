
module.exports = inject;

function inject(serv, settings) {
  serv.tickCount = 0;


  serv.setTickInterval = ticksPerSecond => {
    serv.stopTickInterval();

    serv.tickInterval = setInterval(function() {
      serv.tickCount++;
      serv.emit('tick', serv.tickCount);
    }, 1000/ticksPerSecond);
  };

  serv.stopTickInterval = () => {
    if (serv.tickInterval) clearInterval(serv.tickInterval);
    serv.tickInterval = null;
  };


  serv.setTickInterval(20);
}

