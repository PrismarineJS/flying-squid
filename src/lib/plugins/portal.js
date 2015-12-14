var {detectFrame,generatePortal,addPortalToWorld}=require("flying-squid").portal_detector;
var Vec3 = require("vec3").Vec3;
var UserError=require("flying-squid").UserError;

module.exports.player=function(player,serv) {
  player.use_flint_and_steel=async (referencePosition,direction) => {
    let block=await player.world.getBlock(referencePosition);
    if(block.name=="obsidian")
    {
      var frames=await detectFrame(player.world,referencePosition,direction);
      if(frames.length==0)
        return;
      var air=frames[0].air;
      air.forEach(pos => player.setBlock(pos,90,(frames[0].bottom[0].x-frames[0].bottom[1].x)!=0 ? 1 : 2));
      player.world.portals.push(frames[0]);
    }
  };

  player.on("dug",({position,block}) => {

    function destroyPortal(portal,positionAlreadyDone=null)
    {
      player.world.portals=player.world.portals.splice(player.world.portals.indexOf(portal),1);
      portal
        .air
        .filter(ap => positionAlreadyDone==null || !ap.equals(positionAlreadyDone))
        .forEach(ap => serv.setBlock(player.world,ap,0,0));
    }

    if(block.name=="obsidian")
    {
      const p=player.world.portals.filter(({bottom,top,left,right}) =>
        [].concat.apply([], [bottom, left, right,top])
          .reduce((acc,pos) => acc || pos.equals(position),false));
      p.forEach(portal => destroyPortal(portal,position));
    }

    if(block.name=="portal")
    {
      const p=player.world.portals.filter(({air}) => air.reduce((acc,pos) => acc || pos.equals(position),false));
      p.forEach(portal => destroyPortal(portal,position));
    }
  });



  player.commands.add({
    base: 'portal',
    info: 'Create a portal frame',
    usage: '/portal <bottomLeft:<x> <y> <z>> <direction:x|z> <width> <height>',
    op: true,
    parse(str) {
      var pars=str.split(' ');
      if(pars.length!=6)
        return false;
      let [x,y,z,direction,width,height]=pars;
      [x,y,z] = [x,y,z].map((val, i) => serv.posFromString(val, player.position[['x','y','z'][i]] / 32));
      const bottomLeft=new Vec3(x,y,z);
      if(direction!="x" && direction!="z")
        throw new UserError('Wrong Direction');
      direction=direction=='x' ? new Vec3(1,0,0) : Vec3(0,0,1);
      return {bottomLeft,direction,width,height};
    },
    async action({bottomLeft,direction,width,height}) {
      var portal=generatePortal(bottomLeft,direction,width,height);
      await addPortalToWorld(player.world,portal,[],[],(pos,type) => {
        serv.setBlock(player.world,pos,type,0);
      });
    }
  });

};