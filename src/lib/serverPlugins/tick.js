
module.exports = inject;

function inject(serv, settings) {
	serv.setTickInterval = setTickInterval;
	serv.stopTickInterval = stopTickInterval;
	serv.tickCount = 0;

	serv.setTickInterval(20);
}

function setTickInterval(ticksPerSecond) {
	var serv = this;
	stopTickInterval();

	serv.tickInterval = setInterval(function() {
		serv.tickCount++;
		serv.emit('tick', serv.tickCount);
	}, 1000/ticksPerSecond);
}

function stopTickInterval() {
	if (serv.tickInterval) clearInterval(serv.tickInterval);
	serv.tickInterval = null;
}