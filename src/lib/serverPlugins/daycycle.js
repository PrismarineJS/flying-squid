
module.exports = inject;

function inject(serv, settings) {
	serv.setTime = function(time) {
		serv.time = time;
		serv._writeAll('update_time', {
			age: [0, 0], // TODO
			time: [0, serv.time]
		});
	}

	serv.doDaylightCycle = true;

	serv.time = 0;

	serv.on('tick', function() {
		if (!serv.doDaylightCycle) return;
		if (serv.tick % 20 == 0) serv.setTime((serv.time + 20) % 24000); // Vanilla only does it every second
	})
}