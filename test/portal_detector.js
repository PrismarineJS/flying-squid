var {detectFrame,findPotentialLines,findBorder,getAir}=require("flying-squid").portal_detector;
var World = require('prismarine-world');
var Chunk = require('prismarine-chunk')(require("flying-squid").version);
var Vec3 = require("vec3").Vec3;
var assert = require('assert');


describe("Detect portal", function() {



  var bottom=[new Vec3(3, 1, 1), new Vec3(4, 1, 1)];
  var left=[new Vec3(2, 2, 1), new Vec3(2, 3, 1), new Vec3(2, 4, 1)];
  var right=[new Vec3(5, 2, 1), new Vec3(5, 3, 1), new Vec3(5, 4, 1)];
  var top=[new Vec3(3, 5, 1), new Vec3(4, 5, 1)];
  var expectedBorder=[
    bottom,
    left,
    right,
    top
  ];
  var air=[new Vec3(3, 2, 1),new Vec3(3, 3, 1),new Vec3(3, 4, 1),new Vec3(4, 2, 1),new Vec3(4, 3, 1),new Vec3(4, 4, 1)];

  var world;
  before(function(){
    world=new World();
    var chunk=new Chunk();

    expectedBorder.forEach(border => border.forEach(pos => chunk.setBlockType(pos,49)));
    air.forEach(pos => chunk.setBlockType(pos,0));

    return world.setColumn(0,0,chunk);
  });


  describe("detect potential first lines",function(){
    it("detect potential first lines from bottom left", async function() {
      let potentialLines=await findPotentialLines(world,bottom[0],new Vec3(0,1,0));
      assert.deepEqual(potentialLines,[
        {
          "direction": new Vec3(1,0,0),
          "line": bottom
        }
      ]);
    });

    it("detect potential first lines from bottom right", async function() {
      let potentialLines=await findPotentialLines(world,bottom[bottom.length-1],new Vec3(0,1,0));
      assert.deepEqual(potentialLines,[
        {
          "direction": new Vec3(1,0,0),
          "line": bottom
        }
      ]);
    });


    it("detect potential first lines from top left", async function() {
      let potentialLines=await findPotentialLines(world,top[0],new Vec3(0,-1,0));
      assert.deepEqual(potentialLines,[
        {
          "direction": new Vec3(1,0,0),
          "line": top
        }
      ]);
    });

    it("detect potential first lines from top right", async function() {
      let potentialLines=await findPotentialLines(world,top[top.length-1],new Vec3(0,-1,0));
      assert.deepEqual(potentialLines,[
        {
          "direction": new Vec3(1,0,0),
          "line": top
        }
      ]);
    });

    it("detect potential first lines from left top", async function() {
      let potentialLines=await findPotentialLines(world,left[left.length-1],new Vec3(1,0,0));
      assert.deepEqual(potentialLines,[
        {
          "direction": new Vec3(0,1,0),
          "line": left
        }
      ]);
    });

    it("detect potential first lines from right bottom", async function() {
      let potentialLines=await findPotentialLines(world,right[0],new Vec3(-1,0,0));
      assert.deepEqual(potentialLines,[
        {
          "direction": new Vec3(0,1,0),
          "line": right
        }
      ]);
    });
  });


  describe("find borders",function() {
    it("find borders from bottom", async function () {
      var border = await findBorder(world, {
        "direction": new Vec3(1, 0, 0),
        "line": bottom
      }, new Vec3(0, 1, 0));
      assert.deepEqual(border, expectedBorder)
    });

    it("find borders from top", async function () {
      var border = await findBorder(world, {
        "direction": new Vec3(1, 0, 0),
        "line": top
      }, new Vec3(0, -1, 0));
      assert.deepEqual(border, expectedBorder)
    });

    it("find borders from left", async function () {
      var border = await findBorder(world, {
        "direction": new Vec3(0, 1, 0),
        "line": left
      }, new Vec3(1, 0, 0));
      assert.deepEqual(border, expectedBorder)
    });
    it("find borders from right", async function () {
      var border = await findBorder(world, {
        "direction": new Vec3(0, 1, 0),
        "line": right
      }, new Vec3(-1, 0, 0));
      assert.deepEqual(border, expectedBorder)
    });
  });

  describe("detect portals",function(){
    it("detect portals from bottom left",async function() {
      var portals=await detectFrame(world,bottom[0],new Vec3(0,1,0));
      assert.deepEqual(portals,[expectedBorder])
    });
    it("detect portals from right top",async function() {
      var portals=await detectFrame(world,right[right.length-1],new Vec3(-1,0,0));
      assert.deepEqual(portals,[expectedBorder])
    })
  });

  it("get air",function(){
    var foundAir=getAir(expectedBorder);
    assert.deepEqual(foundAir,air);
  });
});
