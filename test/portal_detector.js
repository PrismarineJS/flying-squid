const {detectFrame,findPotentialLines,findBorder,getAir,generateLine,generatePortal,makeWorldWithPortal}=require("flying-squid").portal_detector;
const Vec3 = require("vec3").Vec3;
const assert = require('chai').assert;
const range = require('range').range;


describe("Generate portal",function(){
  it("generate a line",() => {
    assert.deepEqual(generateLine(new Vec3(3,1,1),new Vec3(1,0,0),2),[new Vec3(3, 1, 1), new Vec3(4, 1, 1)])
  });
  it("generate a portal", () => {
    assert.deepEqual(generatePortal(new Vec3(2,1,1),new Vec3(1,0,0),4,5),{
      bottom:generateLine(new Vec3(3,1,1),new Vec3(1,0,0),2),
      left:generateLine(new Vec3(2,2,1),new Vec3(0,1,0),3),
      right:generateLine(new Vec3(5,2,1),new Vec3(0,1,0),3),
      top:generateLine(new Vec3(3,5,1),new Vec3(1,0,0),2),
      air:generateLine(new Vec3(3,2,1),new Vec3(0,1,0),3).concat(generateLine(new Vec3(4,2,1),new Vec3(0,1,0),3))
    })
  });
});

describe("Detect portal", function() {
  this.timeout(60 * 1000);
  const portalData=[];
  portalData.push({
    name:"simple portal frame x",
    bottomLeft:new Vec3(2,1,1),
    direction:new Vec3(1,0,0),
    width:4,
    height:5,
    additionalAir:[],
    additionalObsidian:[]
  });
  portalData.push({
    name:"simple portal frame z",
    bottomLeft:new Vec3(2,1,1),
    direction:new Vec3(0,0,1),
    width:4,
    height:5,
    additionalAir:[],
    additionalObsidian:[]
  });
  portalData.push({
    name:"big simple portal frame x",
    bottomLeft:new Vec3(2,1,1),
    direction:new Vec3(1,0,0),
    width:10,
    height:10,
    additionalAir:[],
    additionalObsidian:[]
  });
  portalData.push({
    name:"simple portal frame x with borders",
    bottomLeft:new Vec3(2,1,1),
    direction:new Vec3(1,0,0),
    width:4,
    height:5,
    additionalAir:[],
    additionalObsidian:[new Vec3(2,1,1),new Vec3(5,1,1),new Vec3(2,6,1),new Vec3(5,6,1)]
  });
  const {bottom,left,right,top,air}=generatePortal(new Vec3(2,1,2),new Vec3(1,0,0),4,5);

  portalData.push({
    name:"2 portals",
    bottomLeft:new Vec3(2,1,1),
    direction:new Vec3(1,0,0),
    width:4,
    height:5,
    additionalAir:air,
    additionalObsidian:[].concat.apply([], [bottom, left, right,top])
  });


  portalData.push({
    name:"huge simple portal frame z",
    bottomLeft:new Vec3(2,1,1),
    direction:new Vec3(0,0,1),
    width:50,
    height:50,
    additionalAir:[],
    additionalObsidian:[]
  });


  portalData.forEach(({name,bottomLeft,direction,width,height,additionalAir,additionalObsidian}) => {
    const portal=generatePortal(bottomLeft,direction,width,height);
    const {bottom,left,right,top,air}=portal;
    describe("Detect "+name,() => {
      const expectedBorder={bottom,left,right,top};

      let world;
      before(async function(){
        world=await makeWorldWithPortal(portal,additionalAir,additionalObsidian);
      });


      describe("detect potential first lines",function(){
        it("detect potential first lines from bottom left", async function() {
          let potentialLines=await findPotentialLines(world,bottom[0],new Vec3(0,1,0));
          assert.include(potentialLines,{
              "direction": direction,
              "line": bottom
            });
        });

        it("detect potential first lines from bottom right", async function() {
          let potentialLines=await findPotentialLines(world,bottom[bottom.length-1],new Vec3(0,1,0));
          assert.include(potentialLines,{
              "direction": direction,
              "line": bottom
            });
        });


        it("detect potential first lines from top left", async function() {
          let potentialLines=await findPotentialLines(world,top[0],new Vec3(0,-1,0));
          assert.include(potentialLines,{
              "direction": direction,
              "line": top
            });
        });

        it("detect potential first lines from top right", async function() {
          let potentialLines=await findPotentialLines(world,top[top.length-1],new Vec3(0,-1,0));
          assert.include(potentialLines,{
              "direction": direction,
              "line": top
            });
        });

        it("detect potential first lines from left top", async function() {
          let potentialLines=await findPotentialLines(world,left[left.length-1],direction);
          assert.include(potentialLines,{
              "direction": new Vec3(0,1,0),
              "line": left
            });
        });

        it("detect potential first lines from right bottom", async function() {
          let potentialLines=await findPotentialLines(world,right[0],direction.scaled(-1));
          assert.include(potentialLines,{
              "direction": new Vec3(0,1,0),
              "line": right
            });
        });
      });


      describe("find borders",function() {
        it("find borders from bottom", async function () {
          const border = await findBorder(world, {
            "direction": direction,
            "line": bottom
          }, new Vec3(0, 1, 0));
          assert.deepEqual(border, expectedBorder)
        });

        it("find borders from top", async function () {
          const border = await findBorder(world, {
            "direction": direction,
            "line": top
          }, new Vec3(0, -1, 0));
          assert.deepEqual(border, expectedBorder)
        });

        it("find borders from left", async function () {
          const border = await findBorder(world, {
            "direction": new Vec3(0, 1, 0),
            "line": left
          },direction);
          assert.deepEqual(border, expectedBorder)
        });
        it("find borders from right", async function () {
          const border = await findBorder(world, {
            "direction": new Vec3(0, 1, 0),
            "line": right
          }, direction.scaled(-1));
          assert.deepEqual(border, expectedBorder)
        });
      });

      describe("detect portals",function(){
        it("detect portals from bottom left",async function() {
          const portals=await detectFrame(world,bottom[0],new Vec3(0,1,0));
          assert.deepEqual(portals,[portal])
        });
        it("detect portals from top left",async function() {
          const portals=await detectFrame(world,top[0],new Vec3(0,-1,0));
          assert.deepEqual(portals,[portal])
        });
        it("detect portals from right top",async function() {
          const portals=await detectFrame(world,right[right.length-1],direction.scaled(-1));
          assert.deepEqual(portals,[portal])
        })
      });

      it("get air",function(){
        const foundAir=getAir(expectedBorder);
        assert.deepEqual(foundAir,air);
      });
    });
  });


});


describe("Doesn't detect non-portal",function() {
  const portalData=[];

  portalData.push({
    name:"simple portal frame x with one obsidian in the middle",
    bottomLeft:new Vec3(2,1,1),
    direction:new Vec3(1,0,0),
    width:5,
    height:5,
    additionalAir:[],
    additionalObsidian:[new Vec3(4,3,1)]
  });

  portalData.forEach(({name,bottomLeft,direction,width,height,additionalAir,additionalObsidian}) => {
    const portal = generatePortal(bottomLeft, direction, width, height);
    const {bottom,left,right,top}=portal;
    describe("Doesn't detect detect " + name, () => {
      let world;
      before(async function () {
        world=await makeWorldWithPortal(portal, additionalAir, additionalObsidian);
      });

      describe("doesn't detect portals",function(){
        it("doesn't detect portals from bottom left",async function() {
          const portals=await detectFrame(world,bottom[0],new Vec3(0,1,0));
          assert.deepEqual(portals,[])
        });
        it("doesn't detect portals from top left",async function() {
          const portals=await detectFrame(world,top[0],new Vec3(0,-1,0));
          assert.deepEqual(portals,[])
        });
        it("doesn't detect portals from right top",async function() {
          const portals=await detectFrame(world,right[right.length-1],direction.scaled(-1));
          assert.deepEqual(portals,[])
        })
      });

    });
  });
});
