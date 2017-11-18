const net = require("net");
describe("Server", () => {
  let serv;
  beforeAll(function(done){
    serv = require("../app");
    serv.on("listening", function(){
      done(null);
    });
  });

  afterAll(function(done){
    serv._server.close();
    serv._server.on("close", function(){
      done();
    });
  });
  it("Is running", done => {
    const client = net.Socket();
    client.connect(serv._server.socketServer.address().port, "127.0.0.1", done);
    client.on("error", done);
  });
});
