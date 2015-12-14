var Vec3 = require("vec3").Vec3;
var assert = require('assert');
var flatMap = require('flatmap');
var range = require('range').range;

module.exports={detectFrame,findPotentialLines,findBorder,getAir};

async function findLineInDirection(world,startingPoint,type,direction,directionV)
{
  var line=[];
  var point=startingPoint;
  while((await world.getBlock(point)).name==type && (await world.getBlockType(point.plus(directionV)))==0)
  {
    line.push(point);
    point=point.plus(direction);
  }
  return line;
}

async function findLine(world,startingPoint,type,direction,directionV)
{
  var firstSegment=(await findLineInDirection(world,startingPoint.plus(direction.scaled(-1)),type,direction.scaled(-1),directionV)).reverse();
  var secondSegment=await findLineInDirection(world,startingPoint,type,direction,directionV);
  return firstSegment.concat(secondSegment);
}


async function findPotentialLines(world,startingPoint,directionV)
{
  var firstLineDirection=directionV.y!=0 ? [new Vec3(1,0,0),new Vec3(0,0,1)] :
    [new Vec3(0,1,0)];
  return (await Promise.all(firstLineDirection
    .map(async d => ({direction:d,line:(await findLine(world,startingPoint,'obsidian',d,directionV))}))))
    .filter(line => (line.line.length>=3 && line.direction.y!=0) ||
    (line.line.length>=2 && line.direction.y==0));
}

function positiveOrder(line,direction)
{
  if(direction.x==-1 || direction.y==-1 || direction.z==-1)
    return line.reverse();
  return line;
}

async function findBorder(world,{line,direction},directionV)
{
  var bottom=line;
  if(bottom.length==0)
    return [];
  var left=await findLineInDirection(world,bottom[0].plus(direction.scaled(-1).plus(directionV)),'obsidian',directionV,direction);
  var right=await findLineInDirection(world,bottom[line.length-1].plus(direction).plus(directionV),'obsidian',
    directionV,direction.scaled(-1));
  if(left.length==0 || left.length!=right.length)
    return null;
  var top=await findLineInDirection(world,left[left.length-1].plus(direction).plus(directionV),'obsidian',
    direction,directionV.scaled(-1));
  if(bottom.length!=top.length)
    return null;

  left=positiveOrder(left,directionV);
  right=positiveOrder(right,directionV);
  top=positiveOrder(top,direction);


  if(direction.y!=0)
    [bottom,left,right,top]=[left,bottom,top,right];

  [bottom,top]=directionV.y<0 ? [top,bottom] : [bottom,top];
  var horDir=direction.x!=0 || directionV.x!=0 ? 'x' :'z';
  [left,right]=direction[horDir]<0 || directionV[horDir]<0 ? [right,left] : [left,right];

  if(bottom.length<2 || top.length<2 || left.length<3 || right.length<3)
    return null;

  return {bottom,left,right,top};
}

async function detectFrame(world,startingPoint,directionV)
{
  let potentialLines=await findPotentialLines(world,startingPoint,directionV);

  return asyncFilter((await Promise.all(potentialLines
    .map(line => findBorder(world,line,directionV))))
    .filter(border => border!=null)
    .map(({bottom,left,right,top}) => ({bottom,left,right,top,air:getAir({bottom,left,right,top})})),
    async ({air}) => await isAllAir(world,air));
}

async function asyncEvery(array,pred) {
  return Promise.all(array.map(x => pred(x).then(y => y ? true : Promise.reject(false))))
    .then(results => true)
    .catch(x => false);
}

function asyncFilter(array,pred) {
  return Promise.all(array.map(e => pred(e).then(a => a ? e : null))).then(r => r.filter(a => a!=null));
}

async function isAllAir(world,blocks)
{
  return asyncEvery(blocks,async block => (await world.getBlockType(block))==0);
}

function getAir(border)
{
  var {bottom,top}=border;
  return flatMap(bottom,pos => range(1,top[0].y-bottom[0].y).map(i => pos.offset(0,i,0)));
}