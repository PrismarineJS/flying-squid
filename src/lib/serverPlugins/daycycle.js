
module.exports = inject;

function inject(serv, settings) {
  serv.setTime = (time) => {
    serv.time = time;
    serv._writeAll('update_time', {
      age: [0, 0], // TODO
      time: [0, serv.time]
    });
  };

  serv.doDaylightCycle = true;

  serv.time = 0;

  serv.on('tick', function(count) {
    if (!serv.doDaylightCycle) return;
    if (count % 20 == 0) {
      serv.setTime((serv.time + 20) % 24000); // Vanilla only does it every second
     }
  })
}