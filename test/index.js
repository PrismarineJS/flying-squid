var boot = require('../app').boot,
    shutdown = require('../app').shutdown,
    port = require('../app').port;
   
    it('passes', function() {
      return true;
    });
    describe("Server", function() {
      if("Is running", function(done) {
        var client = net.Socket();
        client.connect(25565, '127.0.0.1', function() {
          client.close(); // or whatever the method to close the socket;
          done();
        });
        client.on('error', function(err) {
          done();
        });
    });
});
