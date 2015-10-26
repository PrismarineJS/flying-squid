var net = require('net');
describe("Server", function() {
  before(function(done){
    var serv=require("../app");
    serv.on("listening",function(){
      done(null);
    })
  });
  it("Is running", function(done) {
    var client = net.Socket();
    client.connect(25565, '127.0.0.1', done);
    client.on('error', done);
  });
});
