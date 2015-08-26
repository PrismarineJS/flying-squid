module.exports=inject;

function inject(serv)
{
  serv.entityMaxId=0;
  serv.playersConnected=[];
  serv.uuidToPlayer={};
}