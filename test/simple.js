var net = require('net');
describe("Server", function() {
  var serv;
  before(function(done){
    serv=require("../app");
    serv.on("listening",function(){
      done(null);
    })
  });

  after(function(done){
    serv._server.close();
    serv._server.on("close",function(){
      done();
    });
  });
  it("Is running", function(done) {
    var client = net.Socket();
    client.connect(serv._server.socketServer.address().port, '127.0.0.1', done);
    client.on('error', done);
  });
});
