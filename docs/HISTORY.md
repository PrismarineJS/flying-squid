## 1.6.0
* [tab complete & `/give`, `/effect` improvements (#635)](https://github.com/PrismarineJS/flying-squid/commit/2c1bc4628eebe04eab6f1636d4e90f199fb5fb19) (thanks @zardoy)
* [Add a few flags to cli & disable `everybody-op` by default? (#634)](https://github.com/PrismarineJS/flying-squid/commit/9e3fafd5aba90e6d4eaf0dcef8e6ed9b529c7073) (thanks @zardoy)
* [Update Minecraft Wiki link to new domain after fork (#639)](https://github.com/PrismarineJS/flying-squid/commit/cb3cfd071b8d66a03d7db0d365dfca112be22305) (thanks @misode)
* [Make created world loadable in singleplayer (#638)](https://github.com/PrismarineJS/flying-squid/commit/37bb939fbabf4d81bca39a9a6a4ce2a67fddfd15) (thanks @zardoy)
* [Add command gh workflow allowing to use release command in comments (#629)](https://github.com/PrismarineJS/flying-squid/commit/2113acf3129bee44e68e0ad3b0014a8fb4325745) (thanks @rom1504)
* [Update to node 18 (#627)](https://github.com/PrismarineJS/flying-squid/commit/1112ec7bce2ea9091c10248ff53dfbbc260c7040) (thanks @rom1504)
* [Delete CNAME](https://github.com/PrismarineJS/flying-squid/commit/1158513f782b41a25a9ff5859495b6d2be4d31f0) (thanks @rom1504)
* [fixed typos (#621)](https://github.com/PrismarineJS/flying-squid/commit/3336120afb83a3f52ade447b5adaa162f3fb40c1) (thanks @xkcdstickfigure)
* [Bump mkdirp from 0.5.6 to 2.1.3 (#620)](https://github.com/PrismarineJS/flying-squid/commit/0f9687f973767789fcb996f36eca7a0e5746723b) (thanks @dependabot[bot])
* [Kf106/upload chunk (#614)](https://github.com/PrismarineJS/flying-squid/commit/353a6fc5aa1fd8c970bb259fc7ff9344b25ee433) (thanks @kf106)
* [Bump expect from 28.1.3 to 29.1.2 (#611)](https://github.com/PrismarineJS/flying-squid/commit/f35481145e3dde3ce0ba3b956e915bd25e626454) (thanks @dependabot[bot])
* [chore: patch placement (#604)](https://github.com/PrismarineJS/flying-squid/commit/2eea573728f0b1e8e8fee06c71ffb41e1b765054) (thanks @TheoPierne)
* [Slot update notification (#602)](https://github.com/PrismarineJS/flying-squid/commit/16d712d5e45a4fc33851bc239dc6c1b034002dae) (thanks @kf106)
* [Fix breaking/placing blocks in adventure mode (#595)](https://github.com/PrismarineJS/flying-squid/commit/a4ea2bec9db6f97cf5dd5f992c7b78f9845b3ad9) (thanks @Saiv46)
* [Commands(OP): Make player non-case-sensitive (#596)](https://github.com/PrismarineJS/flying-squid/commit/e271ee25ee0be1fd4fa7a4c16278554495ffb32d) (thanks @u9g)
* [Fix item drop collection issue (#598)](https://github.com/PrismarineJS/flying-squid/commit/349f3940e6740becb53a556b1b54a3a1358f31cf) (thanks @darksunlight)

## 1.5.0
* Downgrade compramised color package (#549)
* Added serv.warn() & other small changes (#542)
* Bump prismarine-entity from 1.2.0 to 2.0.0 (#546)
* Update README.md (#543)
* Bump long from 4.0.0 to 5.1.0 (#538)
* Bump prismarine-nbt from 1.6.0 to 2.0.0 (#539)
* moved dockerfiles out and updated readme (#511)
* Create `empty` generation (#537)
* Merge pull request #519 from para-dise/patch-1
* Fix missing return for spawnObject
* remove flying-squid-modpe
* Bump yargs from 16.2.0 to 17.0.1 (#495)
* Refactor command.js to be clearer (#474)
* Unload unneeded chunks when players move out of that zone (#492)
* Enable docker build back
* Moved player health, food, and stamina updates to player.js (#486)
* Fixed useItem (#476)
* Bump prismarine-windows from 1.6.0 to 2.0.0 (#471)

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