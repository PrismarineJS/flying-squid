## 1.4.0
* Server brand (@GroobleDierne)
* minor fixes

## 1.3.2
* docker support (thanks @SonLight)

## 1.3.1
* Swap attribute names (thanks @mdashlw)
* Use bedrock instead of polished andesite (thanks @GroobleDierne)
* Fix crash in /gamemode command (thanks @lleyton)
* Remove deprecated/heavy dependencies (request, request-promise) in favor of needle (thanks @WasabiThumb)
* Remove blocks id (thanks @GroobleDierne)

## 1.3.0

* 1.9, 1.10, 1.11, 1.13, 1.14, 1.15, 1.16 support added (thanks @Deudly and @Karang for 1.13, thanks @IdanHo for >= 1.14)
* implement server commands (thanks @redcarti)

## 1.2.1

* update to new pchunk + use bitmask

## 1.2.0

* fixes on useItem (thanks @bitknox)
* fix egg spawning (thanks @rtm516)
* tab complete functionality (thanks @jvyden420)
* read/save player files (thanks @rrwr)
* implement some redstones (thanks @Karang)
* implement block actions (thanks @FalcoG)

## 1.1.2

* copy README.md to root, so it's displayed by npm

## 1.1.1

* fix external.js
* fix /setblock test, fix #344
* use docsify for doc and use discord

## 1.1.0

* add doc of player.commands
* Remove babel and unused dependencies
* Migrate to CircleCI 2 and Jest
* Add standard linting
* 1.8 and 1.12 support

## 1.0.0

* implement difficulty (thanks @theskiier14)
* weather Command (thanks @OverloadedWolf)
* remove block from inventory when placing it (thanks @109C)
* add node-voxel-worldgen generation to generation list
* limit /portal command to 21x21
* fix undefined disconnected
* limit the number of entities to options["max-entities"]
* remove /spawn and /spawnObject
* update dependencies
* move diamond-square to its own package
* add flying-squid-schematic plugin to plugins list
* add serv.reloadChunk

## 0.5.1

* makes worldFolder option optional

## 0.5.0

* improve ticks performance a bit
* add /summonMany
* load/save the seed
* takes worldFolder instead of regionFolder as option to load the world

## 0.4.0

* fix last problems with portal frame detection
* add effects and abilities
* add colors to chat function
* don't spawn in water
* implement portal creation (no teleporting yet)
* implement latency
* use prismarine-world 0.4.0 to implement loading/saving
* add player-list-text config option
* add everybody-op option

## 0.3.1

 * don't login if the client is already ended
 * make /attach use the selectors, fix UserError, check /tp has one target
 * create an entity.attach, and add a /pile command
 * improve tests
 * fix player.kick, add serv.quit(reason)
 * fix badges on npm

## 0.3.0

* sounds
* lot of use of destructuring in the code
* handle view distance properly
* entities : spawning, physics, some sounds
* block drops
* refactoring : serv/player/entity plugins together
* lot of new commands : 
/summon, /spawn, /spawnObject, /kill, /attach, /teleport (thanks @azastrael), /op, /deop, /ban-ip, /pardon-ip, /xp
* entity properties directly in player
* proper plugins handling
* behaviors
* player inventory (thanks @109C)
* tests using mineflayer
* unload chunks
* xp
* selectors
* ip ban (thanks @109C)
* improve /help command

## 0.2.0
*First functional release*

* Infinite worlds
* World generation (thanks @JWo1F!)
* World loading from anvil files
* Improved error handling
* Implement kicking and banning (thanks @demipixel!)
* Using ES6
* ModPE basic support (thanks @Creeplays!)
* Better commands, proper commands class instead of just IFS
* Enable compression!
* Multi-world support: overworld + nether (thanks @demipixel!)

## 0.1.0
*Initial release*

First version, basic functionalities