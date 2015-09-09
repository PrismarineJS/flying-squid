allow_extra_data_values = true;
max_brush_radius = 5;


//use-inventory (not working):
enable = false;
allow_override = true;
creative_mode_overrides = false;


//super-pickaxe (not working):
drop_items = true;
many_drop_items = false;
max_super_pickaxe_size = 5;


//navigation-wand (not working):
navigation_item = 345;
max_distance = 100;


//history (not working):
size = 15;
expiration = 10;


//(working)
coloured_messages = false;
wand_item = 271;
toggle_wand = false;
show_help_on_first_use = true;



/*##############################
VARIABLES
##############################*/

var first_use = false;

var blocks = [["air", 0], ["stone", 1], ["grass", 2], ["dirt", 3], ["cobblestone", 4], ["wood", 5], ["planks", 5], ["sapling", 6], ["bedrock", 7], ["water", 8], ["flowing_water", 8], ["stationary_water", 9], ["lava", 10], ["flowing_lava", 10], ["stationary_water", 11], ["sand", 12], ["gravel", 13], ["gold_ore", 14], ["iron_ore", 15], ["coal_ore", 16], ["log", 17], ["leaves", 18], ["sponge", 19], ["glass", 20], ["lapis_lazuli_ore", 21], ["lapis_ore", 21], ["lapis_lazuli_block", 22], ["lapis_block", 22], ["sandstone", 24], ["bed", 26], ["powered_rail", 27], ["golden_rail", 27], ["web", 30], ["long_grass", 31], ["tallgrass", 31], ["dead_bush", 32], ["deadbush", 32], ["cloth", 35], ["wool", 35], ["yellow_flower", 37], ["red_flower", 38], ["brown_mushroom", 39], ["red_mushroom", 40], ["gold_block", 41], ["iron_block", 42], ["double_step", 43], ["double_stone_slab", 43], ["step",44 ], ["stone_slab", 44], ["brick", 45], ["brick_block", 45], ["tnt", 46], ["bookcase", 47], ["bookshelf", 47], ["mossy_cobblestone", 48], ["obsidian", 49], ["torch", 50], ["fire", 51], ["mob_spawner", 52], ["wooden_stairs", 53], ["oak_stairs", 53], ["oak_wood_stairs", 53], ["chest", 54], ["diamond_ore", 56], ["diamond_block", 57], ["workbench", 58], ["crafting_table", 58], ["crops", 59], ["wheat", 59], ["soil", 60], ["farmland", 60], ["furnace", 61], ["burning_furnace", 62], ["lit_furnace", 62], ["sign_post", 63], ["standing_sign", 63], ["wooden_door", 64], ["ladder", 65], ["minecart_tracks", 66], ["rails", 66], ["cobblestone_stairs", 67], ["stone_stairs", 67], ["wall_sign", 68], ["iron_door", 71], ["redstone_ore", 73], ["unlit_redstone_ore", 73], ["glowing_redstone_ore", 74], ["lit_redstone_ore", 74], ["snow_layer", 78], ["snow", 78], ["ice", 79], ["snow_block", 80], ["cactus", 81], ["clay", 82], ["reed", 83], ["reeds", 83], ["fence", 85], ["pumpkin", 86], ["netherstone", 87], ["netherrack", 87], ["lightstone", 89], ["glowstone", 89], ["jackolantern", 91], ["lit_pumpkin", 91], ["cake_block", 92], ["cake", 92], ["trap_door", 96], ["trapdoor", 96], ["silverfish_block", 97], ["monster_egg", 97], ["stone_brick", 98], ["stonebrick", 98], ["brown_mushroom_cap", 99], ["brown_mushroom_block", 99], ["red_mushroom_cap", 100], ["red_mushroom_block", 100], ["iron_bars", 101], ["glass_pane", 102], ["melon_block", 103], ["melon", 103], ["pumpkin_stem", 104], ["melon_stem", 105], ["vine", 106], ["fence_gate", 107], ["brick_stairs", 108], ["stone_brick_stairs", 109], ["myclium", 110], ["lily_pad", 111], ["waterlily", 111], ["nether_brick", 112], ["nether_brick_fence", 113], ["nether_brick_stairs", 114], ["end_portal_frame", 120], ["end_stone", 121], ["double_wooden_step", 125], ["double_wooden_slab", 125], ["wooden_step", 126], ["wooden_slab", 126], ["cocoa_plant", 127], ["cocoa", 127], ["sandstone_stairs", 128], ["emerald_ore", 129], ["emerald_block", 133], ["spruce_wood_stairs", 134], ["spruce_stairs", 134], ["birch_wood_stairs", 135], ["birch_stairs", 135], ["jungle_wood_stairs", 136], ["jungle_stairs", 136], ["cobblestone_wall", 139], ["carrots", 141], ["potatoes", 142], ["quartz_block", 155], ["quartz_stairs", 156], ["stained_clay", 159], ["stained_hardened_clay", 159], ["leaves2", 161], ["log2", 162], ["acacia_wood_stairs", 163], ["acacia_stairs", 163], ["dark_oak_wood_stairs", 164], ["dark_oak_stairs", 164], ["hay_block", 170], ["carpet", 171], ["hardened_clay", 172], ["coal_block", 173], ["packed_ice", 174], ["double_plant", 175], ["spruce_fence_gate", 183], ["birch_fence_gate", 184], ["jungle_fence_gate", 185], ["acacia_fence_gate", 186], ["dark_oak_fence_gate", 187], ["podzol", 243], ["beetroot", 244], ["stone_cutter", 245], ["stonecutter", 245], ["glowing_obsidian", 246], ["nether_reactor_core", 247], ["nether_reactor", 247]];
//var ctx = com.mojang.minecraftpe.MainActivity.currentMainActivity.get();
var BTN;

var selector = 1;
var pos1 = null;
var pos2 = null;

var minX, minY, minZ, maxX, maxY, maxZ;
c = [];
c1 = [];
c2 = [];
r = [];

clipboard = [];

undo = [];
var undoX, undoY, undoZ;

brush = [];
mask = -1;
var count = 1;



/*##############################
COMMAND REGISTRATION
##############################*/

function procCmd(command) {
   var cmd = command.split(" ");

   if(cmd[1] && allow_extra_data_values == true) c = cmd[1].split(":");
   else c[0] = cmd[1];

   if(cmd[2] && allow_extra_data_values == true) c1 = cmd[2].split(":");
   else c1[0] = cmd[2];

   if(cmd[2]) r = cmd[2].split(",");
   else {
      r[0] = cmd[2];
      r[1] = cmd[2];
   }

   if(cmd[3] && allow_extra_data_values == true) c2 = cmd[3].split(":");
   else c2[0] = cmd[3];

   switch(cmd[0]) {

/*############
HELP
############*/

      case "help":
      case "/help":
         if(cmd[1]) showHelp(cmd[1]);

         else showHelp("1");
      break;


/*############
WAND
############*/

      case "wand":
      case "/wand":
         switch(Level.getGameMode()) {
            case 0:
               Player.addItemInventory(wand_item, 1, 0);
            break;

            case 1:
               Entity.setCarriedItem(getPlayerEnt(), wand_item, 1, 0);
            break;
         }

         if(show_help_on_first_use == true && first_use == false) {
            first_use = true;
            Msg("Destroy block: select pos #1; Tap block: select pos #2")
         }
      break;


/*############
TOGGLEEDITWAND
############*/

      case "toggleeditwand":
         switch(toggle_wand) {
            case false:
               toggle_wand = true;
               Msg("Edit wand disabled.");
            break;

            case true:
               toggle_wand = false;
               Msg("Edit wand enabled.");
            break;
         }
      break;


/*############
SEL
############*/

      case "/sel":
      case ";":
      case "/desel":
      case "/deselect":

         if(!cmd[1]) {
            pos1 = null;
            pos2 = null;
            Msg("Selection cleared.");
         }

         switch(cmd[1]) {
            case "cuboid":
               selector = 1;
               Msg("Cuboid: destroy block for point 1, tap block for point 2");
            break;
         }
      break;


/*############
POSITIONS
############*/

      case "/pos1":
         if(cmd[1] && cmd[2] && cmd[3]) {
            pos1 = [Math.round(cmd[1]), Math.round(cmd[2]), Math.round(cmd[3])];
            Msg("First Position set to (" + pos1[0] + ".0, " + pos1[1] + ".0, " + pos1[2] + ".0).");
         }

         else if(!cmd[1]) {
            pos1 = [pX, Math.round(pY), pZ];
            Msg("First Position set to (" + pos1[0] + ".0, " + pos1[1] + ".0, " + pos1[2] + ".0).");
         }

         else if(cmd[1] && (!cmd[2] || !cmd[3])) Msg("Â§cYou must either specify 0 or 3 coordiante values.");

         else if(cmd[4]) Msg("Â§cToo many arguments.");
      break;


      case "/pos2":
         if(cmd[1] && cmd[2] && cmd[3]) {
            pos2 = [Math.round(cmd[1]), Math.round(cmd[2]), Math.round(cmd[3])];
            Msg("Second Position set to (" + pos2[0] + ".0, " + pos2[1] + ".0, " + pos2[2] + ".0).");
         }

         else if(!cmd[1]) {
            pos2 = [pX, Math.round(pY), pZ];
            Msg("Second Position set to (" + pos2[0] + ".0, " + pos2[1] + ".0, " + pos2[2] + ".0).");
         }

         else if(cmd[1] && (!cmd[2] || !cmd[3])) Msg("Â§cYou must either specify 0 or 3 coordiante values.");

         else if(cmd[4]) Msg("Â§cToo many arguments.");
      break;


/*############
UNDO
############*/

      case "undo":
      case "/undo":
         Undo();
      break;


/*############
PASTE
############*/

      case "/paste":
         if(!cmd[1] && clipboard != null) {
            saveUndoPaste();
            paste(0);
         }

         else if(clipboard == null) Msg("Â§No clipboard content.");

         else if(cmd[1]) Msg("Â§cToo many arguments.");
      break;


/*############
CLEARCLIPBOARD
############*/

      case "clearclipboard":
         clipboard = null;
      break;


      default:
         for(var i = 0; i < blocks.length; i++) {
            if(blocks[i][0] == c[0]) c[0] = blocks[i][1];
            if(blocks[i][0] == c1[0]) c1[0] = blocks[i][1];
            if(blocks[i][0] == c2[0]) c2[0] = blocks[i][1];

            if(i == blocks.length - 1) {
               if(pos1 == null || pos2 == null || pos1 != null || pos2 != null) {
                  switch(cmd[0]) {

/*############
MASK
############*/

      case "mask":
         if(cmd[1] && cmd[1] >= 0 && cmd[1] <= 255) {
            mask = c[0];
            Msg("Brush mask set.");
         }

         else if(cmd[1] < 0 || cmd[1] > 255) Msg("Â§cNot a valid block id/name.");

         else if(!cmd[1]) {
            mask = -1;
            Msg("Brush mask disabled.");
         }
      break;


/*############
BRUSH
############*/

                     case "/br":
                        if(Player.getCarriedItem() > 255) {
                           if(cmd[1]) {
                              switch(cmd[1]) {
                                 case "c":
                                 case "cyl":
                                 case "cylinder":
                                    if(c1[0] != "h" && c1[0] <= 255 && c1[0] >= 0) {
                                       if(cmd[3] && !cmd[4] && cmd[3] <= max_brush_radius) {
                                          brush = ["cylinder", c1[0], c1[1], cmd[3], 1, false];
                                          Msg("Cylinder brush shape equipped (" + cmd[3] + " by 1).");
                                          dismissBrushButton();
                                          openBrushButton();
                                       }

                                       else if(cmd[4] && c1[0] <= 255 && c1[0] >= 0 && !cmd[5] && cmd[3] <= max_brush_radius && cmd[4] <= max_brush_radius) {
                                          brush = ["cylinder", c1[0], c1[1], cmd[3], cmd[4], false];
                                          Msg("Cylinder brush shape equipped (" + cmd[3] + " by " + cmd[4] + ").");
                                          dismissBrushButton();
                                          openBrushButton();
                                       }

                                       else if(cmd[3] > max_brush_radius || cmd[4] > max_brush_radius) Msg("Â§cThe radius must be smaller than " + max_brush_radius + ".");

                                       else if(cmd[5]) Msg("Â§cToo many arguments.");

                                       else if(!cmd[3]) Msg("Â§cYou need to specify a radius.");
                                    }

                                    else if(cmd[2] == "h") {
                                       if(c2[0] && c2[0] >= 0 && c2[0] <= 255) {
                                          if(cmd[4] && !cmd[5] && cmd[4] <= max_brush_radius) {
                                             brush = ["cylinder", c2[0], c2[1], cmd[4], 1, true];
                                             Msg("Hollow cylinder brush shape equipped (" + cmd[3] + " by 1).");
                                             dismissBrushButton();
                                             openBrushButton();
                                          }

                                          else if(cmd[5] && !cmd[6] && cmd[4] <= max_brush_radius && cmd[5] <= max_brush_radius) {
                                             brush = ["cylinder", c2[0], c2[1], cmd[4], cmd[5], true];
                                             Msg("Hollow cylinder brush shape equipped (" + cmd[3] + " by " + cmd[4] + ").");
                                             dismissBrushButton();
                                             openBrushButton();
                                          }

                                          else if(cmd[4] > max_brush_radius || cmd[5] > max_brush_radius) Msg("Â§cThe radius must be smaller than " + max_brush_radius + ".");

                                          else if(cmd[6]) Msg("Â§cToo many arguments.");

                                          else Msg("Â§cYou need to specify a radius.");
                                       }

                                       else if(c2[0] > 255 || c2[0] < 0) Msg("Â§cInvalid block id/name.");

                                       else if(!c2[0]) Msg("Â§cYou need to specify a block.");
                                    }

                                    else if(c1[0] > 255 || c1[0] < 0) Msg("Â§cInvalid block id/name.");

                                    else if(!cmd[2]) Msg("Â§cYou need to specify a block.");
                                 break;

                                 case "s":
                                 case "sphere":
                                 case "cylinder":
                                    if(c1[0] != "h" && c1[0] <= 255 && c1[0] >= 0) {
                                       if(cmd[3] && !cmd[4] && cmd[3] <= max_brush_radius) {
                                          brush = ["sphere", c1[0], c1[1], cmd[3], 0, false];
                                          Msg("Sphere brush shape equipped (" + cmd[3] + ").");
                                          dismissBrushButton();
                                          openBrushButton();
                                       }

                                       else if(cmd[3] > max_brush_radius) Msg("Â§cThe radius must be smaller than " + max_brush_radius + ".");

                                       else if(cmd[4]) Msg("Â§cToo many arguments.");

                                       else if(!cmd[3]) Msg("Â§cYou need to specify a radius.");
                                    }

                                    else if(cmd[2] == "h") {
                                       if(c2[0] && c2[0] >= 0 && c2[0] <= 255) {
                                          if(cmd[4] && !cmd[5] && cmd[4] <= max_brush_radius) {
                                             brush = ["sphere", c2[0], c2[1], cmd[4], 0, true];
                                             Msg("Sphere brush shape equipped (" + cmd[4] + ").");
                                             dismissBrushButton();
                                             openBrushButton();
                                          }

                                          else if(cmd[4] > max_brush_radius) Msg("Â§cThe radius must be smaller than " + max_brush_radius + ".");

                                          else if(cmd[5]) Msg("Â§cToo many arguments.");

                                          else Msg("Â§cYou need to specify a radius.");
                                       }

                                       else if(c2[0] > 255 || c2[0] < 0) Msg("Â§cInvalid block id/name.");

                                       else if(!c2[0]) Msg("Â§cYou need to specify a block.");
                                    }

                                    else if(c1[0] > 255 || c1[0] < 0) Msg("Â§cInvalid block id/name.");

                                    else if(!cmd[2]) Msg("Â§cYou need to specify a block.");
                                 break;

                                 default:
                                    Msg("Â§cInvalid brush.");
                                 break;
                              }
                           } else Msg("Â§cYou need to specify a brush.");
                        } else Msg("Â§cCan't bind tool to a block.");
                     break;


/*############
CYLINDER
############*/

                     case "/cyl":
                        if(cmd[1]) {
                           if(cmd[2] && !cmd[3]) {
                              saveUndoCylinder(cmd[2] * 2, pY, cmd[2] * 2, cmd[2], 1);
                              cylinder(c[0], c[1], cmd[2], 1, 0, false);
                           }

                           else if(cmd[3] && !cmd[4]) {
                              saveUndoCylinder(cmd[2] * 2, cmd[3], cmd[2] * 2, cmd[2], cmd[3]);
                              cylinder(c[0], c[1], cmd[2], cmd[3], 0, false);
                           }

                           else if(cmd[4]) Msg("Â§cToo many arguments.");

                           else Msg("Â§cYou need to specify a radius.");
                        }

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
HOLLOW CYLINDER
############*/

                     case "/hcyl":
                        if(cmd[1]) {
                           if(cmd[2] && !cmd[3]) {
                              saveUndoCylinder(cmd[2] * 2, pY, cmd[2] * 2, cmd[2], 1);
                              cylinder(c[0], c[1], cmd[2], 1, 0, true);
                           }

                           else if(cmd[3] && !cmd[4]) {
                              saveUndoCylinder(cmd[2] * 2, pY, cmd[2] * 2, cmd[2], 1);
                              cylinder(c[0], c[1], cmd[2], cmd[3], 0, true);
                           }

                           else if(cmd[4]) Msg("Â§cToo many arguments.");

                           else Msg("Â§cYou need to specify a radius.");
                        }

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
SPHERE
############*/

                     case "/sphere":
                        if(cmd[1]) {
                           if(cmd[2] && !cmd[3]) {
                              saveUndoSphere(cmd[2] * 2, cmd[2] * 2, cmd[2] * 2, cmd[2]);
                              sphere(c[0], c[1], cmd[2], 0, false);
                           }

                           else if(cmd[3]) Msg("Â§cToo many arguments.");

                           else Msg("Â§cYou need to specify a radius.");
                        }

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
HOLLOW SPHERE
############*/

                     case "/hsphere":
                        if(cmd[1]) {
                           if(cmd[2] && !cmd[3]) {
                              saveUndoSphere(cmd[2] * 2, cmd[2] * 2, cmd[2] * 2, cmd[2]);
                              sphere(c[0], c[1], cmd[2], 0, true);
                           }

                           else if(cmd[3]) Msg("Â§cToo many arguments.");

                           else Msg("Â§cYou need to specify a radius.");
                        }

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
FORESTGEN
############*/

                     case "forestgen":
                        if(cmd[1] && !cmd[2]) {
                           saveUndoSphere(cmd[1] * 2, cmd[1] * 2, cmd[1] * 2, cmd[1]);
                           forestgen(cmd[1], "oak", 50, 0);
                        }

                        else if(cmd[2] && !cmd[4]) {
                           switch(cmd[2]) {
                              case "oak":
                              case "tree":
                              case "regular":
                                 saveUndoSphere(cmd[1] * 2, cmd[1] * 2, cmd[1] * 2, cmd[1]);

                                 if(cmd[3] && cmd[3] <= 100) forestgen(cmd[1], "oak", cmd[3], 0);

                                 else if(!cmd[3]) forestgen(cmd[1], "oak", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              case "birch":
                                 saveUndoSphere(cmd[1] * 2, cmd[1] * 2, cmd[1] * 2, cmd[1]);

                                 if(cmd[3] && cmd[3] <= 100) forestgen(cmd[1], "birch", cmd[3], 0);

                                 else if(!cmd[3]) forestgen(cmd[1], "birch", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              case "spruce":
                              case "redwood":
                              case "sequoia":
                                 saveUndoSphere(cmd[1] * 2, cmd[1] * 2, cmd[1] * 2, cmd[1]);

                                 if(cmd[3] && cmd[3] <= 100) forestgen(cmd[1], "spruce", cmd[3], 0);

                                 else if(!cmd[3]) forestgen(cmd[1], "spruce", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              case "jungle":
                              case "smalljungle":
                                 saveUndoSphere(cmd[1] * 2, cmd[1] * 2, cmd[1] * 2, cmd[1]);

                                 if(cmd[3] && cmd[3] <= 100) forestgen(cmd[1], "jungle", cmd[3], 0);

                                 else if(!cmd[3]) forestgen(cmd[1], "jungle", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              default:
                                 Msg("Â§cInvalid tree name.");
                              break;
                           }
                        }

                        else if(cmd[4]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a radius.");
                     break;


/*############
PUMPKINS
############*/

                     case "pumpkins":
                        if(cmd[1] && !cmd[2]) {
                           saveUndoSphere(cmd[1] * 2, cmd[1] * 2, cmd[1] * 2, cmd[1]);
                           pumpkins(cmd[1], 0);
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a radius.");
                     break;


/*############
DEFAULT
############*/

                     case "undo":
                     case "/undo":
                     case "/count":
                     case "/copy":
                     case "/cut":
                     case "/paste":
                     case "/set":
                     case "/line":
                     case "/re":
                     case "/rep":
                     case "/replace":
                     case "/overlay":
                     case "/center":
                     case "/middle":
                     case "/walls":
                     case "/outline":
                     case "/faces":
                     case "/hollow":
                     case "/forest":
                     case "/flora":
                        if(pos1 == null || pos2 == null) Msg("Â§cYou need to make a selection first.");
                     break;

                     default:
                        Msg("Â§cUnknown command. Type ''help'' for help.");
                     break;
                  }
               }


               if(pos1 != null && pos2 != null) {
                  switch(cmd[0]) {

/*############
COUNT
############*/

                     case "/count":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              count(c[0], c[1], 0, false);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
SIZE
############*/

                     case "/size":
                        
                     break;


/*############
COPY
############*/

                     case "/copy":
                        if(cmd[1] && cmd[1] >= 0 && cmd[1] <= 255 && !cmd[2]) copy((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1, 0, cmd[1]);

                        else if(cmd[1] < 0 && cmd[1] > 255) Msg("Â§cInvalid block id/name.");

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else copy((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1, 0, 0);
                     break;


/*############
CUT
############*/

                     case "/cut":
                        if(cmd[1] && cmd[1] >= 0 && cmd[1] <= 255 && !cmd[2]) {
                           saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                           cut((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1, 0, cmd[1]);
                        }

                        else if(cmd[1] < 0 && cmd[1] > 255) Msg("Â§cInvalid block id/name.");

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else {
                           saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                           cut((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1, 0, 0);
                        }
                     break;


/*############
SET
############*/

                     case "/set":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              set(c[0], c[1], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
LINE
############*/

                     case "/line":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              line(c[0], c[1], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
REPLACE
############*/

                     case "/re":
                     case "/rep":
                     case "/replace":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                               replace(c[0], c[1], 0);
                            }

                           else Msg("Â§cInvalid block id/name.");
                        } 

                        else if(cmd[2] && !cmd[3]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              replace1(c1[0], c1[1], c[0], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[3]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
OVERLAY
############*/

                     case "/overlay":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              overlay(c[0], c[1], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
CENTER
############*/

                     case "/center":
                     case "/middle":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              center(c[0], c[1], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
WALLS
############*/

                     case "/walls":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              walls(c[0], c[1], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
OUTLINE
############*/

                     case "/outline":
                     case "/faces":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              outline(c[0], c[1], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cYou need to specify a block.");
                     break;


/*############
HOLLOW
############*/

                     case "/hollow":
                        if(cmd[1] && !cmd[2]) {
                           if(c[0] >= 0 && c[0] <= 255) {
                              saveUndoDefault((maxX - minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);
                              hollow(c[0], c[1], 0);
                           }

                           else Msg("Â§cInvalid block id/name.");
                        }

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else hollow(0, 0, 0);
                     break;


/*############
FOREST
############*/

                     case "/forest":
                        if(cmd[1] && !cmd[3]) {
                           switch(cmd[1]) {
                              case "oak":
                              case "tree":
                              case "regular":
                                 saveUndoTree((maxX- minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);

                                 if(cmd[2] && cmd[2] <= 100) forest("oak", cmd[2], 0);

                                 else if(!cmd[2]) forest("oak", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              case "birch":
                                 saveUndoTree((maxX- minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);

                                 if(cmd[2] && cmd[2] <= 100) forest("birch", cmd[2], 0);

                                 else if(!cmd[2]) forest("birch", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              case "spruce":
                              case "redwood":
                              case "sequoia":
                                 saveUndoTree((maxX- minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);

                                 if(cmd[2] && cmd[2] <= 100) forest("spruce", cmd[2], 0);

                                 else if(!cmd[2]) forest("spruce", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              case "jungle":
                              case "smalljungle":
                                 saveUndoTree((maxX- minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);

                                 if(cmd[2] && cmd[2] <= 100) forest("jungle", cmd[2], 0);

                                 else if(!cmd[2]) forest("jungle", 50, 0);

                                 else Msg("Â§cDensity must be smaller than 100.");
                              break;

                              default:
                                 Msg("Â§cInvalid tree name.");
                              break;
                           }
                        }

                        else if(cmd[3]) Msg("Â§cToo many arguments.");

                        else {
                           saveUndoTree((maxX- minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);

                           if(cmd[2] && cmd[2] <= 100) forest("oak", cmd[2], 0);

                           else if(!cmd[2]) forest("oak", 50, 0);

                           else Msg("Â§cDensity must be smaller than 100.");
                        }
                     break;


/*############
FLORA
############*/

                     case "/flora":
                        saveUndoDefault((maxX- minX) + 1, (maxY - minY) + 1, (maxZ - minZ) + 1);

                        if(cmd[1] && !cmd[2] && cmd[1] <= 100) flora(cmd[1], 0);

                        else if(!cmd[1]) flora(50, 0);

                        else if(cmd[2]) Msg("Â§cToo many arguments.");

                        else Msg("Â§cDensity must be smaller than 100.");
                     break;
                  }
               }
            }
         }
      break;
   }
}



/*##############################
POSITIONS
##############################*/

function useItem(x, y, z, item, block, side) {
   if(item == wand_item && toggle_wand == false) {
      preventDefault();

      switch(selector) {
         case 1:
            pos2 = [x, y, z];
            Msg("Second Position set to (" + pos2[0] + ".0, " + pos2[1] + ".0, " + pos2[2] + ".0).");
         break;
      }
   }
}


function destroyBlock(x, y, z, side) {
   if(getCarriedItem() == wand_item && toggle_wand == false) {
      preventDefault();

      if(Level.getGameMode() == 1) {
         switch(selector) {
            case 1:
               pos1 = [x, y, z];
               Msg("First Position set to (" + pos1[0] + ".0, " + pos1[1] + ".0, " + pos1[2] + ".0).");
            break;
         }
      }
   }
}


function startDestroyBlock(x, y, z, side) {
   if(getCarriedItem() == wand_item && toggle_wand == false) {
      if(Level.getGameMode() == 0) {
         preventDefault();
         switch(selector) {
            case 1:
               pos1 = [x, y, z];
               Msg("First Position set to (" + pos1[0] + ".0, " + pos1[1] + ".0, " + pos1[2] + ".0).");
            break;
         }
      }
   }
}



/*##############################
NORMAL FUNCTIONS
##############################*/

function modTick() {
   if(pos1 != null && pos2 != null) {
      minX = Math.min(pos1[0], pos2[0]);
      minY = Math.min(pos1[1], pos2[1]);
      minZ = Math.min(pos1[2], pos2[2]);
      maxX = Math.max(pos1[0], pos2[0]);
      maxY = Math.max(pos1[1], pos2[1]);
      maxZ = Math.max(pos1[2], pos2[2]);
   }

   pX = Math.round(getPlayerX());
   pY = getPlayerY() - 1;
   pZ = Math.round(getPlayerZ());

   Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir(); Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();Dir();

   if(Player.getCarriedItem() < 256) dismissBrushButton();
}


function Dir() {
   var pitch = ((Entity.getPitch(getPlayerEnt()) + 90) * Math.PI) / 180;
   var yaw = ((Entity.getYaw(getPlayerEnt()) + 90) * Math.PI) / 180;
   var xYaw = pX + ((Math.sin(pitch) * Math.cos(yaw)) * count);
   var yPitch = pY + ((Math.cos(pitch)) * count);
   var zYaw = pZ + ((Math.sin(pitch) * Math.sin(yaw)) * count);
//WIP: Commented because of unfinished world
/*
   if(getTile(xYaw, yPitch, zYaw) == 0 && count < 100) count++;

   else {
      xDir = pX + ((Math.sin(pitch) * Math.cos(yaw)) * count);
      yDir = pY + ((Math.cos(pitch)) * (count - 1));
      zDir = pZ + ((Math.sin(pitch) * Math.sin(yaw)) * count);
      count = 1;
   }
*/
}



/*##############################
WORLDEDIT FUNCTIONS
##############################*/

/*############
HELP
############*/

function showHelp(Help) {
   switch(Help) {
      case "1":
         Msg("Showing help page 1/6:");
         Msg("   //br <s, sphere, c, cylinder> [-h] <block> <radius> [heigth]");
         Msg("   //center <block>");
         Msg("   //copy [leave-block]");
         Msg("   //count <block>");
         Msg("   //cut [leave-block]");
      break;

      case "2":
         Msg("Showing help page 2/6:");
         Msg("   //cyl <block> <radius> [height]");
         Msg("   //flora [density]");
         Msg("   //forest [type [density]]");
         Msg("   /forestgen [type [density]]");
         Msg("   /help [page/command name]");
      break;

      case "3":
         Msg("Showing help page 3/6:");
         Msg("   //hcyl <block> <radius> [height]");
         Msg("   //hollow [block]");
         Msg("   //hsphere <block> <radius>")
         Msg("   //line <block>");
         Msg("   //outline <block>");
      break;

      case "4":
         Msg("Showing help page 4/6:");
         Msg("   //overlay <block>");
         Msg("   //paste");
         Msg("   /pumpkins <radius>");
         Msg("   //pos1 [x, y, z]")
         Msg("   //pos2 [x, y, z]");
      break;

      case "5":
         Msg("Showing help page 5/6:");
         Msg("   //replace <block>");
         Msg("   //replace <from-block> <to-block>");
         Msg("   //sel [selector]");
         Msg("   //set <block>");
         Msg("   //sphere <block> <radius>");
      break;

      case "6":
         Msg("Showing help page 6/6:");
         Msg("   /undo, //undo");
         Msg("   /toggleeditwand");
         Msg("   //walls <block>");
         Msg("   /wand");
      break;

      default:
         Msg("Â§cInvalid help.");
      break;
   }
}


/*############
UNDO
############*/

function Undo() {
   for(var a = 0; a < undo.length; a++) {
      for(var b = 0; b < undo[0].length; b++) {
         for(var c = 0; c < undo[0][0].length; c++) {
            setTile(undoX + a, undoY + b, undoZ + c, undo[a][b][c][0], undo[a][b][c][1]);
         }
      }
   } Msg("Undo successful.");
}


function saveUndoDefault(x, y, z) {
   undoX = minX;
   undoY = minY;
   undoZ = minZ;

   undo = [x];
   for(var a = 0; a < x; a++) {
      undo[a] = [y];
      for(var b = 0; b < y; b++) {
         undo[a][b] = [z];
         for(var c = 0; c < z; c++) {
            undo[a][b][c] = [getTile(minX + a, minY + b, minZ + c), Level.getData(minX + a, minY + b, minZ + c)];
         }
      }
   }
}


function saveUndoTree(x, y, z) {
   undoX = minX;
   undoY = minY;
   undoZ = minZ;

   undo = [x];
   for(var a = -3; a < x + 3; a++) {
      undo[a] = [y];
      for(var b = 0; b < y + 15; b++) {
         undo[a][b] = [z];
         for(var c = -3; c < z + 3; c++) {
            undo[a][b][c] = [getTile(minX + a, minY + b, minZ + c), Level.getData(minX + a, minY + b, minZ + c)];
         }
      }
   }
}


function saveUndoCylinder(x, y, z, Radius, Height) {
   undoX = pX - Radius;
   undoY = pY;
   undoZ = pZ - Radius;

   undo = [x];
   for(var a = -x; a <= x; a++) {
      undo[a] = [y];
      for(var b = 0; b < Height; b++) {
         undo[a][b] = [z];
         for(var c = -z; c <= x; c++) {
            undo[a][b][c] = [getTile(pX - Radius + a, pY + b, pZ - Radius + c), Level.getData(pX - Radius + a, pY + b, pZ - Radius + c)];
         }
      }
   }
}


function saveUndoSphere(x, y, z, Radius) {
   undoX = pX - Radius;
   undoY = pY - Radius;
   undoZ = pZ - Radius;

   undo = [x];
   for(var a = -x; a < x; a++) {
      undo[a] = [y];
      for(var b = -y; b < y; b++) {
         undo[a][b] = [z];
         for(var c = -z; c < x; c++) {
            undo[a][b][c] = [getTile(pX - Radius + a, pY - Radius + b, pZ - Radius + c), Level.getData(pX - Radius + a, pY - Radius + b, pZ - Radius + c)];
         }
      }
   }
}


function saveUndoPaste() {
   x = clipboard.length;
   y = clipboard[0].length;
   z = clipboard[0][0].length;
   undoX = pX;
   undoY = pY;
   undoZ = pZ;

   undo = [x];
   for(var a = 0; a <= x; a++) {
      undo[a] = [y];
      for(var b = 0; b <= y; b++) {
         undo[a][b] = [z];
         for(var c = 0; c <= z; c++) {
            undo[a][b][c] = [getTile(pX + a, pY + b, pZ + c), Level.getData(pX + a, pY + b, pZ + c)];
         }
      }
   }
}


/*############
COPY
############*/

function copy(x, y, z, affected, Block) {
   clipboard = [x]
   for(var a = 0; a < x; a++) {
      clipboard[a] = [y]
      for(var b = 0; b < y; b++) {
         clipboard[a][b] = [z]
         for(var c = 0; c < z; c++) {
            if(getTile(minX + a, minY + b, minZ + c) == Block) clipboard[a][b][c] = [0, 0];

            else clipboard[a][b][c] = [getTile(minX + a, minY + b, minZ + c), Level.getData(minX + a, minY + b, minZ + c)];
            affected++;
         }
      }
   } Msg(affected + " block(s) were copied.");
}


/*############
CUT
############*/

function cut(x, y, z, affected, Block) {
   clipboard = [x]
   for(var a = 0; a < x; a++) {
      clipboard[a] = [y]
      for(var b = 0; b < y; b++) {
         clipboard[a][b] = [z]
         for(var c = 0; c < z; c++) {
            if(getTile(minX + a, minY + b, minZ + c) == Block) {
               setTile(minX + a, minY + b, minZ + c, 0, 0);
               clipboard[a][b][c] = [0, 0];
            }

            else {
               setTile(minX + a, minY + b, minZ + c, 0, 0);
               clipboard[a][b][c] = [getTile(minX + a, minY + b, minZ + c), Level.getData(minX + a, minY + b, minZ + c)];
            }

            affected++;
         }
      }
   } Msg(affected + " block(s) were cutted.");
}


/*############
PASTE
############*/

function paste(affected) {
   for(var a = 0; a < clipboard.length; a++) {
      for(var b = 0; b < clipboard[0].length; b++) {
         for(var c = 0; c < clipboard[0][0].length; c++) {
            setTile(pX + a, pY + b, pZ + c, clipboard[a][b][c][0], clipboard[a][b][c][1]);
            affected++;
         }
      }
   } Msg(affected + " block(s) were pasted.");
}


/*############
CYLINDER
############*/

function cylinder(Block, Data, Radius, Height, affected, Hollow) {
   for(var x = -Radius; x <= Radius; x++) {
      for(var y = 0; y < Height; y++) {
         for(var z = -Radius; z <= Radius; z++) {
            if(x * x + z * z <= Radius * Radius) {
               if(Hollow == false) {
                  setTile(pX + x, pY + y, pZ + z, Block, Data);
                  affected++;
               }

               else {
                  if(x * x + z * z > (Radius - 1) * (Radius - 1)) {
                     setTile(pX + x, pY + y, pZ + z, Block, Data);
                     affected++;
                  }
               }
            }
         }
      }
   } Msg(affected + " block(s) have been created.");
}


function brushCylinder(Block, Data, Radius, Height, Hollow, a, b, c) {
   for(var x = -Radius; x <= Radius; x++) {
      for(var y = 0; y < Height; y++) {
         for(var z = -Radius; z <= Radius; z++) {
            if(x * x + z * z <= Radius * Radius) {
               if(mask == -1) {
                  if(Hollow == false) setTile(a + x, b + y - 1, c + z, Block, Data);

                  else {
                     if(x * x + z * z > (Radius - 1) * (Radius - 1)) setTile(a + x, b + y - 1, c + z, Block, Data);
                  }
               }

               else {
                  if(getTile(a + x, b + y, c + z) == mask) {
                     if(Hollow == false) setTile(a + x, b + y - 1, c + z, Block, Data);

                     else {
                     if(x * x + z * z > (Radius - 1) * (Radius - 1)) setTile(a + x, b + y - 1, c + z, Block, Data);
                     }
                  }
               }
            }
         }
      }
   }
}


/*############
SPHERE
############*/

function sphere(Block, Data, Radius, affected, Hollow) {
   for(var x = -Radius; x <= Radius; x++) {
      for(var y = -Radius; y <= Radius; y++) {
         for(var z = -Radius; z <= Radius; z++) {
            if(x * x + y * y + z * z <= Radius * Radius) {
               if(Hollow == false) {
                  setTile(pX + x, pY + y, pZ + z, Block, Data);
                  affected++;
               }

               else {
                  if(x * x + y * y + z * z > (Radius - 1) * (Radius - 1)) {
                     setTile(pX + x, pY + y, pZ + z, Block, Data);
                     affected++;
                  }
               }
            }
         }
      }
   } Msg(affected + " block(s) have been created.");
}


function brushSphere(Block, Data, Radius, Hollow, a, b, c) {
   for(var x = -Radius; x <= Radius; x++) {
      for(var y = -Radius; y <= Radius; y++) {
         for(var z = -Radius; z <= Radius; z++) {
            if(x * x + y * y + z * z <= Radius * Radius) {
               if(mask == -1) {
                  if(Hollow == false) setTile(a + x, b + y - 1, c + z, Block, Data);

                  else {
                     if(x * x + y * y + z * z > (Radius - 1) * (Radius - 1)) setTile(a + x, b + y - 1, c + z, Block, Data);
                  }
               }

               else {
                  if(getTile(a + x, b + y, c + z) == mask) {
                     if(Hollow == false) setTile(a + x, b + y - 1, c + z, Block, Data);

                     else {
                        if(x * x + y * y + z * z > (Radius - 1) * (Radius - 1)) setTile(a + x, b + y - 1, c + z, Block, Data);
                     }
                  }
               }
            }
         }
      }
   }
}


/*############
FORESTGEN
############*/

function forestgen(Radius, Type, Density, affected) {
   for(var x = -Radius; x <= Radius; x++) {
      for(var y = -Radius; y <= Radius; y++) {
         for(var z = -Radius; z <= Radius; z++) {
            if(Math.floor(Math.random() * 400) + 0 <= Density && (getTile(pX + x, pY + y - 1, pZ + z) == 2 || getTile(pX + x, pY + y - 1, pZ + z) == 3) && getTile(pX + x, pY + y, pZ + z) == 0) {
               switch(Type) {
                  case "oak":
                     affected++;
                     forestOak(pX + x, pY + y - 1, pZ + z);
                  break;

                  case "birch":
                     affected++;
                     forestBirch(pX + x, pY + y - 1, pZ + z);
                  break;

                  case "spruce":
                     if(Math.floor(Math.random() * 10) + 1 == 1) {
                        affected++;
                        forestSpruce(pX + x, pY + y - 1, pZ + z);
                     }
                  break;

                  case "jungle":
                     affected++;
                     forestJungle(pX + x, pY + y - 1, pZ + z);
                  break;
               }
            }
         }
      }
   } Msg(affected + " tree(s) have been created.");
}


/*############
PUMPKINS
############*/

function pumpkins(Radius, affected) {
   for(var x = -Radius; x <= Radius; x++) {
      for(var y = -Radius; y <= Radius; y++) {
         for(var z = -Radius; z <= Radius; z++) {
            if(Math.floor(Math.random() * 200) + 1 == 1 && (getTile(pX + x, pY + y - 1, pZ + z) == 2 || getTile(pX + x, pY + y - 1, pZ + z) == 3) && getTile(pX + x, pY + y, pZ + z) == 0) {
               createPumpkins(pX + x, pY + y, pZ + z);
               affected++;
            }
         }
      }
   } Msg(affected + " pumpkin patche(s) created.");
}


/*############
COUNT
############*/

function count(Block, Data, affected, useData) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(useData == true) {
               if(getTile(x, y, z) == Block && Level.getData(x, y, z) == Data) affected++;
            }

            else {
               if(getTile(x, y, z) == Block) affected++;
            }
         }
      }
   } Msg("Counted: " + affected);
}


/*############
SET
############*/

function set(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            setTile(x, y, z, Block, Data);
            affected++;
         }
      }
   } Msg(affected + " block(s) have been changed.");
}


/*############
LINE
############*/

function line(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if((x == minX && y == minY) || (x == minX && z == minZ) || (x == minX && y == maxY) || (x == minX && z == maxZ) || (x == maxX && y == minY) || (x == maxX && z == minZ) || (x == maxX && y == maxY) || (x == maxX && z == maxZ) || (y == minY && z == minZ) || (y == minY && z == maxZ) || (y == maxY && z == minZ) || (y == maxY && z == maxZ)) {
               setTile(x, y, z, Block, Data);
               affected++;
            }
         }
      }
   } Msg(affected + " block(s) have been changed.");
}


/*############
REPLACE
############*/

function replace(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(getTile(x, y, z) != 0) {
               setTile(x, y, z, Block, Data);
               affected++;
            }
         }
      }
   } Msg(affected + " block(s) have been replaced.");
}


function replace1(Block, Data, RBlock, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(getTile(x, y, z) == RBlock) {
               setTile(x, y, z, Block, Data);
               affected++;
            }
         }
      }
   } Msg(affected + " block(s) have been replaced.");
}


/*############
OVERLAY
############*/

function overlay(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var z = minZ; z <= maxZ; z++) {
         for(var y = maxY; y >= minY; y--) {
            if(getTile(x, y, z) != 0 && getTile(x, y + 1, z) == 0) {
               setTile(x, y + 1, z, Block, Data);
               affected++;
               break;
               return y;
            }
         }
      }
   } Msg(affected + " block(s) have been overlaid.");
}


/*############
CENTER
############*/

function center(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(x == Math.round((minX + maxX) / 2) && y == Math.round((minY + maxY) / 2) && z == Math.round((minZ + maxZ) / 2)) {
               setTile(x, y, z, Block, Data);
               affected++;
            }
         }
      }
   } Msg("Center set (" + affected + " block(s) changed).");
}


/*############
WALLS
############*/

function walls(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(x == minX || x == maxX || z == minZ || z == maxZ) {
               setTile(x, y, z, Block, Data);
               affected++;
            }
         }
      }
   } Msg(affected + " block(s) have been changed.");
}


/*############
OUTLINE
############*/

function outline(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(x == minX || x == maxX || y == minY || y == maxY || z == minZ || z == maxZ) {
               setTile(x, y, z, Block, Data);
               affected++;
            }
         }
      }
   } Msg(affected + " block(s) have been changed.");
}


/*############
HOLLOW
############*/

function hollow(Block, Data, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(x != minX && x != maxX && y != minY && y != maxY && z != minZ && z != maxZ) {
               setTile(x, y, z, Block, Data);
               affected++;
            }
         }
      }
   } Msg(affected + " block(s) have been changed.");
}


/*############
FOREST
############*/

function forest(Type, Density, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(Math.floor(Math.random() * 400) + 0 <= Density && (getTile(x, y - 1, z) == 2 || getTile(x, y - 1, z) == 3) && getTile(x, y, z) == 0) {
               switch(Type) {
                  case "oak":
                     affected++;
                     forestOak(x, y - 1, z);
                  break;

                  case "birch":
                     affected++;
                     forestBirch(x, y - 1, z);
                  break;

                  case "spruce":
                     if(Math.floor(Math.random() * 10) + 1 == 1) {
                        affected++;
                        forestSpruce(x, y - 1, z);
                     }
                  break;

                  case "jungle":
                     affected++;
                     forestJungle(x, y - 1, z);
                  break;
               }
            }
         }
      }
   } Msg(affected + " tree(s) have been created.");
}


/*############
FLORA
############*/

function flora(Density, affected) {
   for(var x = minX; x <= maxX; x++) {
      for(var y = minY; y <= maxY; y++) {
         for(var z = minZ; z <= maxZ; z++) {
            if(Math.floor(Math.random() * 150) + 0 <= Density && (getTile(x, y - 1, z) == 2 || getTile(x, y - 1, z) == 3) && getTile(x, y, z) == 0) {
               if(Math.floor(Math.random() * 3) + 0 == 0) {
                  affected++;
                  setTile(x, y, z, 31, Math.floor(Math.random() * 2) + 0);
               }

               else if(Math.floor(Math.random() * 3) + 0 == 1) {
                  affected++;
                  setTile(x, y, z, 37, 0);
               }

               else if(Math.floor(Math.random() * 3) + 0 == 2) {
                  affected++;
                  setTile(x, y, z, 38, Math.floor(Math.random() * 9) + 0);
               }
            }

            else if(Math.floor(Math.random() * 150) + 0 <= Density && getTile(x, y - 1, z) == 12 && getTile(x, y, z) == 0) {
               if(Math.floor(Math.random() * 2) + 0 == 0) {
                  affected++;
                  setTile(x, y, z, 81, 0);
               }

               else if(Math.floor(Math.random() * 2) + 0 == 1) {
                  affected++;
                  setTile(x, y, z, 32, 0);
               }
            }
         }
      }
   } Msg(affected + " flora created.");
}



/*##############################
TREE GENERATION
##############################*/

function forestOak(x, y, z) {
   var height = Math.floor(Math.random() * 3) + 1;

   for(var a = -2; a < 3; a++) {
      for(var b = 1; b < 3; b++) {
         for(var c = -2; c < 3; c++) {
            if(getTile(x + a, y + b + height, z + c) == 0) {
               setTile(x + a, y + b + height, z + c, 18, 0);
            }
         }
      }
   }

   for(var d = 0; d <= height + 2; d++) {
      setTile(x, y + d + 1, z, 17, 0);
   }

   setTile(x + 1, y + height + 3, z, 18, 0);
   setTile(x - 1, y + height + 3, z, 18, 0);
   setTile(x, y + height + 3, z + 1, 18, 0);
   setTile(x, y + height + 3, z - 1, 18, 0);
   setTile(x, y + height + 4, z, 18, 0);
   setTile(x + 1, y + height + 4, z, 18, 0);
   setTile(x - 1, y + height + 4, z, 18, 0);
   setTile(x, y + height + 4, z + 1, 18, 0);
   setTile(x, y + height + 4, z - 1, 18, 0);
}


function forestBirch(x, y, z) {
   var height = Math.floor(Math.random() * 4) + 2;

   for(var a = -2; a < 3; a++) {
      for(var b = 1; b < 3; b++) {
         for(var c = -2; c < 3; c++) {
            if(getTile(x + a, y + b + height, z + c) == 0) {
               setTile(x + a, y + b + height, z + c, 18, 2);
            }
         }
      }
   }

   for(var d = 0; d <= height + 2; d++) {
      setTile(x, y + d + 1, z, 17, 2);
   }

   setTile(x + 1, y + height + 3, z, 18, 2);
   setTile(x - 1, y + height + 3, z, 18, 2);
   setTile(x, y + height + 3, z + 1, 18, 2);
   setTile(x, y + height + 3, z - 1, 18, 2);
   setTile(x, y + height + 4, z, 18, 2);
   setTile(x + 1, y + height + 4, z, 18, 2);
   setTile(x - 1, y + height + 4, z, 18, 2);
   setTile(x, y + height + 4, z + 1, 18, 2);
   setTile(x, y + height + 4, z - 1, 18, 2);
}


function forestSpruce(x, y, z) {
   var height = 4;

   for(var a = -2; a < 3; a++) {
      for(var b = 0; b < 1; b++) {
         for(var c = -2; c < 3; c++) {
            if(getTile(x + a, y + b + height + 1, z + c) == 0) {
               setTile(x + a, y + b + height + 1, z + c, 18, 1);
               setTile(x + 2, y + b + height + 1, z + 2, 0, 0);
               setTile(x - 2, y + b + height + 1, z - 2, 0, 0);
               setTile(x + 2, y + b + height + 1, z - 2, 0, 0);
               setTile(x - 2, y + b + height + 1, z + 2, 0, 0);
            }
         }
      }
   }

   for(var a = -2; a < 3; a++) {
      for(var b = 0; b < 1; b++) {
         for(var c = -2; c < 3; c++) {
            if(getTile(x + a, y + b + height - 1, z + c) == 0) {
               setTile(x + a, y + b + height - 1, z + c, 18, 1);
               setTile(x + 2, y + b + height - 1, z + 2, 0, 0);
               setTile(x - 2, y + b + height - 1, z - 2, 0, 0);
               setTile(x + 2, y + b + height - 1, z - 2, 0, 0);
               setTile(x - 2, y + b + height - 1, z + 2, 0, 0);
            }
         }
      }
   }

   for(var a = -3; a < 4; a++) {
      for(var b = 0; b < 1; b++) {
         for(var c = -3; c < 4; c++) {
            if(getTile(x + a, y + b + height - 2, z + c) == 0) {
               setTile(x + a, y + b + height - 2, z + c, 18, 1);
               setTile(x + 3, y + b + height - 2, z + 3, 0, 0);
               setTile(x - 3, y + b + height - 2, z - 3, 0, 0);
               setTile(x + 3, y + b + height - 2, z - 3, 0, 0);
               setTile(x - 3, y + b + height - 2, z + 3, 0, 0);
               setTile(x + 3, y + b + height - 2, z + 2, 0, 0);
               setTile(x + 3, y + b + height - 2, z - 2, 0, 0);
               setTile(x - 3, y + b + height - 2, z + 2, 0, 0);
               setTile(x - 3, y + b + height - 2, z - 2, 0, 0);
               setTile(x + 2, y + b + height - 2, z + 3, 0, 0);
               setTile(x - 2, y + b + height - 2, z + 3, 0, 0);
               setTile(x + 2, y + b + height - 2, z - 3, 0, 0);
               setTile(x - 2, y + b + height - 2, z - 3, 0, 0);
            }
         }
      }
   }

   for(var d = 0; d <= height + 2; d++) {
      setTile(x, y + d + 1, z, 17, 1);
   }

   setTile(x + 1, y + height, z, 18, 1);
   setTile(x - 1, y + height, z, 18, 1);
   setTile(x, y + height, z + 1, 18, 1);
   setTile(x, y + height, z - 1, 18, 1);
   setTile(x + 1, y + height + 2, z, 18, 1);
   setTile(x - 1, y + height + 2, z, 18, 1);
   setTile(x, y + height + 2, z + 1, 18, 1);
   setTile(x, y + height + 2, z - 1, 18, 1);
   setTile(x, y + height + 3, z, 18, 1);
   setTile(x + 1, y + height + 4, z, 18, 1);
   setTile(x - 1, y + height + 4, z, 18, 1);
   setTile(x, y + height + 4, z + 1, 18, 1);
   setTile(x, y + height + 4, z - 1, 18, 1);
   setTile(x, y + height + 4, z, 18, 1);
}


function forestJungle(x, y, z) {
   var height = Math.floor(Math.random() * 6) + 2;

   for(var a = -2; a < 3; a++) {
      for(var b = 1; b < 3; b++) {
         for(var c = -2; c < 3; c++) {
            if(getTile(x + a, y + b + height, z + c) == 0) {
               setTile(x + a, y + b + height, z + c, 18, 3);
            }
         }
      }
   }

   for(var d = 0; d <= height + 2; d++) {
      setTile(x, y + d + 1, z, 17, 3);

      switch(Math.floor(Math.random() * 10) + 1) {
         case 1:
            for(var e = 0; e <= height + 2; e++) {
               if(getTile(x + 1, y + e, z) == 0) {
                  setTile(x + 1, y + e, z, 106, 2);
               }
            }
         break;

         case 2:
            for(var e = 0; e <= height + 2; e++) {
               if(getTile(x - 1, y + e, z) == 0) {
                  setTile(x - 1, y + e, z, 106, 8);
               }
            }
         break;

         case 3:
            for(var e = 0; e <= height + 2; e++) {
               if(getTile(x, y + e, z + 1) == 0) {
                  setTile(x, y + e, z + 1, 106, 4);
               }
            }
         break;

         case 4:
            for(var e = 0; e <= height + 2; e++) {
               if(getTile(x, y + e, z - 1) == 0) {
                  setTile(x, y + e, z - 1, 106, 1);
               }
            }
         break;
      }
   }

   setTile(x + 1, y + height + 3, z, 18, 3);
   setTile(x - 1, y + height + 3, z, 18, 3);
   setTile(x, y + height + 3, z + 1, 18, 3);
   setTile(x, y + height + 3, z - 1, 18, 3);
   setTile(x, y + height + 4, z, 18, 3);
   setTile(x + 1, y + height + 4, z, 18, 3);
   setTile(x - 1, y + height + 4, z, 18, 3);
   setTile(x, y + height + 4, z + 1, 18, 3);
   setTile(x, y + height + 4, z - 1, 18, 3);
}


function createPumpkins(x, y, z) {
   switch(Math.floor(Math.random() * 3) + 1) {
      case 1:
         setTile(x, y, z, 86, 0);
         setTile(x + 2, y, z, 86, 0);
         setTile(x - 2, y, z - 1, 86, 0);
         setTile(x + 3, y, z + 2, 86, 0);
         setTile(x - 2, y, z + 3, 86, 0);
         setTile(x, y, z - 3, 86, 0);
         setTile(x, y, z + 2, 86, 0);
         setTile(x + 1, y, z - 1, 18, 0);
         setTile(x - 2, y, z + 1, 18, 0);
         setTile(x + 1, y, z + 1, 18, 0);
         setTile(x, y, z - 2, 18, 0);
      break;

      case 2:
         setTile(x + 3, y, z, 86, 0);
         setTile(x + 2, y, z, 86, 0);
         setTile(x - 1, y, z - 1, 86, 0);
         setTile(x + 3, y, z + 2, 86, 0);
         setTile(x - 4, y, z + 2, 86, 0);
         setTile(x + 1, y, z - 2, 86, 0);
         setTile(x + 1, y, z - 3, 18, 0);
         setTile(x - 2, y, z + 1, 18, 0);
         setTile(x + 1, y, z + 1, 18, 0);
         setTile(x + 1, y, z - 2, 18, 0);
      break;

      case 3:
         setTile(x, y, z + 1, 86, 0);
         setTile(x + 2, y, z, 86, 0);
         setTile(x + 2, y, z - 1, 86, 0);
         setTile(x + 3, y, z + 4, 86, 0);
         setTile(x - 1, y, z + 3, 86, 0);
         setTile(x + 1, y, z - 2, 86, 0);
         setTile(x + 1, y, z - 1, 18, 0);
         setTile(x - 2, y, z + 1, 18, 0);
         setTile(x + 1, y, z, 18, 0);
         setTile(x, y, z - 3, 18, 0);
      break;
   }
}



/*##############################
MESSAGES
##############################*/

function Msg(msg) {
   switch(coloured_messages) {
      case false:
         clientMessage(msg);
      break;

      case true:
         clientMessage("Â§d" + msg);
      break;
   }
}


/*##############################
GUI
##############################*/

function openBrushButton() {
}


function dismissBrushButton() {
}