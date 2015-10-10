
module.exports = inject;

function inject(serv, settings) {
	serv.setTickInterval = setTickInterval;
	serv.stopTickInterval = stopTickInterval;
	serv.tick = 0;

	serv.setTickInterval(20);
}

function setTickInterval(ticksPerSecond) {
	var serv = this;
	if (serv.tickInterval) clearInterval(serv.tickInterval);

	serv.tickInterval = setInterval(function() {
		serv.tick++;
		serv.emit('tick', serv.tick);
	}, 1000/ticksPerSecond);
}

function stopTickInterval() {
	if (serv.tickInterval) clearInterval(serv.tickInterval);
	serv.tickInterval = null;
}