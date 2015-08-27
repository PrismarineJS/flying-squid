module.exports=inject;

function inject(serv)
{
  serv.entityMaxId=0;
  serv.players=[];
  serv.uuidToPlayer={};
  serv.entities={};
}