module.exports = inject;

function inject(serv, player, self) {
    
    player.plugins[self.id].pos = {
        1: null,
        2: null
    };
    player.plugins[self.id].op = false;
    self.areas = [];
    
    player = player;
    
    player.on('command_cancel', function(e, cancel) {
        var player = this;
        var text = e.message;
        var split = text.split(' ');
        if (split[0] != 'wg') return;
        else cancel();
        var opped = player.plugins[self.id].op;
        
        if (split[1] == 'pos1' && opped) {
            self.setPosition(player, 1, player.entity.position.x>>5, player.entity.position.z>>5);
            player.chat('Set pos1 at ' + (player.entity.position.x>>5) + ',' + (player.entity.position.z>>5));
        }
        else if (split[1] == 'pos2' && opped) {
            self.setPosition(player, 2, player.entity.position.x>>5, player.entity.position.z>>5);
            player.chat('Set pos2 at ' + (player.entity.position.x>>5) + ',' + (player.entity.position.z>>5));
        }
        else if (split[1] == 'set' && opped) {
            var success = self.setArea(player.plugins[self.id].pos);
            if (!success) {
                player.chat('You need to set two positions to set an area. Move to the location you want and use:');
                player.chat('"/wg pos1" or "/wg pos2"');
            } else {
                player.chat('Successfully set area! (Size: ' + success.width + 'x' + success.length + ')');
                self.clearPosition(player, 1);
                self.clearPosition(player, 2);
            }
        } else if (split[1] == 'clear' && opped) {
            self.clearPosition(player, 1);
            self.clearPosition(player, 2);
            player.chat('Cleared positions');
        } else if (split[1] == 'op') {
            var playerTarget = serv.getPlayer(split[2]);
            if (!playerTarget) {
                player.chat('No such player "' + split[2] + '"');
            } else {
                playerTarget.plugins[self.id].op = true;
                player.chat('WG Opped ' + split[2]);
            }
        } else if (split[1] == 'deop' && opped) {
            var playerTarget = serv.getPlayer(split[2]);
            if (!playerTarget) {
                player.chat('No such player "' + split[2] + '"');
            } else {
                playerTarget.plugins[self.id].op = false;
                player.chat('WG Deopped ' + split[2]);
            }
        } else if (split[1] == 'help') {
            var messages = [
                'World Guard is used to restrict building areas!',
                'Use /wg pos1 or /wg pos2 to set your two positions.',
                'Use /wg set to confirm the positions.',
                'Use /wg op <user> to allow a user to set positions or build/mine in restricted areas',
                'Use /wg deop <user> to remove op.',
                'Use /wg clear to clear positions',
                'Use /wg list to list all restricted areas you are in (and their IDs)',
                'Use /wg delete <id> to delete a restricted area'
            ];
            for (var m in messages) {
                player.chat(messages[m]);
            }
        } else if (split[1] == 'list' && opped) {
            var areas = self.areasInPosition(player.entity.position.x>>5, player.entity.position.z>>5);
            if (!areas.length) {
                player.chat('You are not in any restricted areas!');
            } else player.chat('==== LIST OF AREAS ====');
            for (var a in areas) {
                var ar = areas[a];
                var str = ar[0] + '] ' + ar[1][1].x + ',' + ar[1][1].z + ' to ' + ar[1][2].x + ',' + ar[1][2].z;
                str += ' (' + (Math.abs(ar[1][1].x - ar[1][2].x)+1) + 'x' + (Math.abs(ar[1][1].z - ar[1][2].z)+1) + ')';
                player.chat(str);
            }
        } else if (split[1] == 'delete' && opped) {
            if (!self.areas[split[2]]) {
                player.chat('Area with id ' + split[2] + ' does not exist!');
            } else {
                self.deleteArea(split[2]);
                player.chat('Deleted area (id ' + split[2] + ')');
            }
        } else {
            player.chat('Not a valid World Guard command! Use /wg help');
        }
    });
    
    player.on('placeBlock_cancel', function(e, cancel) {
        if (player.plugins[self.id].op === true) return;
        if (self.areasInPosition(e.position.x, e.position.z).length) {
            cancel();
            player.sendBlock(e.position, 0);
        }
    });
    
    player.on('finishDig_cancel', function(e, cancel) {
        if (player.plugins[self.id].op === true) return;
        if (self.areasInPosition(e.position.x, e.position.z).length) {
            cancel();
            player.sendBlock(e.position, e.block.type);
        }
    });
    
    self.setPosition = function(player, which, x, z) {
        if (which != 1 && which != 2) return;
        
        player.plugins[self.id].pos[which] = { x: x, z: z}
    };
    
    self.clearPosition = function(player, which) {
        if (which != 1 && which != 2) return;
        player.plugins[self.id].pos[which] = null;
    }
    
    self.setArea = function(pos) {
        if (!pos[1] || !pos[2]) return false;
        
        self.areas.push({
            1: {
                x: pos[1].x,
                z: pos[1].z
            },
            2: {
                x: pos[2].x,
                z: pos[2].z
            }
        });
        return {
            width: Math.abs(pos[1].x-pos[2].x) + 1,
            length: Math.abs(pos[1].z-pos[2].z) + 1
        }
    }
    
    self.deleteArea = function(id) {
        self.areas[id] = null;
    }
    
    self.areasInPosition = function(x, z) {
        var inside = [];
        for (var a in self.areas) {
            if (!self.areas[a]) continue;
            var x1 = self.areas[a][1].x, x2 = self.areas[a][2].x, z1 = self.areas[a][1].z, z2 = self.areas[a][2].z;
            if (x >= Math.min(x1,x2) && x <= Math.max(x1,x2) && z >= Math.min(z1,z2) && z <= Math.max(z1, z2)) {
                inside.push([a, self.areas[a]]);
            }
        }
        return inside;
    }
}