var fs = require("fs");
var vec3 = require("vec3");

module.exports=inject;
function inject(serv, player) {
    //rtl=false;
    lastUsedItem=-1;//Remove in future
    
    player._client.on("block_place", function (packet) {
        if (packet.location.y<0) return;
        //if(!rtl){
            lastUsedItem=packet.heldItem.blockId;
            useItem(packet.location.x,packet.location.y,packet.location.z,packet.heldItem.blockId,serv.world.getBlockType(new vec3(packet.location.x,packet.location.y,packet.location.z)));
        //}
        //else{
            //clientMessage("WIP: needs to update");
        //}
    });
    player._client.on("block_dig",function(packet){
        var pos=new vec3(packet.location);
        currentlyDugBlock=serv.world.getBlock(pos);
        //startDestroyBlock(pos.x, pos.y, pos.z, 0);
        //destroyBlock(pos.x, pos.y, pos.z, 0);
        if(packet.status==0 && player.gameMode!=1)
            startDestroyBlock(pos.x, pos.y, pos.z, 0);
        else if(packet.status==2)
            destroyBlock(pos.x, pos.y, pos.z, 0);
        else if(packet.status==1)
            console.log("Unused in ModPE");
        else if(packet.status==0 && player.gameMode==1)
            destroyBlock(pos.x, pos.y, pos.z, 0);
    });
    player._client.on('position', function (packet) {
        modTick();
    });
    
    function handleCommand(command){
        //if(command=="rtl"){
            //rtl=!rtl;
            //if(rtl){
                //clientMessage("Right click is now left click");
            //}
            //else{
                //clientMessage("Right click no longer left click");
            //}
            //return;
        //}
        procCmd(command);
    }
    player.handleCommand = handleCommand;
    
    
    var text = fs.readFileSync('./lib/modpePlugins/we.js','utf8');
    function clientMessage(message){
        console.log(message);
        player.chat(message);
    }
    function setTile(x,y,z,id,damage){
        serv.setBlock(new vec3(x, y, z), id);
    }
    function getTile(x,y,z){
        serv.world.getBlockType(new vec3(x, y, z));
    }
    function preventDefault(){
        console.log("preventDefault(): WIP");
    }
    function getPlayerX(){
        return player.entity.position.x;
    }
    function getPlayerY(){
        return player.entity.position.y;
    }
    function getPlayerZ(){
        return player.entity.position.z;
    }
    function getPlayerEnt(){
        //console.log("getPlayerEnt(): WIP");
        return null;
    }
    function getCarriedItem(){
            //console.log("getCarriedItem(): WIP");
            return lastUsedItem;
    }
    var Player={
        getCarriedItem:function(){
            //console.log("Player.getCarriedItem(): WIP");
            return lastUsedItem;
        }
    };
    var Entity={
        getPitch:function(){
            //console.log("Entity.getPitch(): WIP");
            return 1;
        },
        getYaw:function(){
            //console.log("Entity.getYaw(): WIP");
            return 1;
        }
    };
    var Level={
        getGameMode:function(){
            return player.gameMode;
        },
        getData:function(){
            //console.log("Level.getData(): WIP");
            return 0;
        }
    }
    eval(text);
    //clientMessage("Squid-ModPE was loaded. By default, right click generates a useItem event, and impossible to \
    //execute destroyBlock or startDestroyBlock event, to change right to left click use /rtl")
}

//console.log(text);
