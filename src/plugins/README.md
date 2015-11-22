## Usage

Drag plugins in this folder.

## Creating Plugin

1) Create folder.

2) Create your index.js inside the folder.

3) `cd` to the folder and type `npm init` and follow instructions.

4) index.js should return in module.exports. player, server, or entity. All are optional.

5.1) If you don't have config/settings.json, create it and copy everything from config/default-settings.json inside.

5.2) Add into plugins `"plugin_name": {}`. Add any options you'd like.

## Publish plugin

Use `npm publish` and follow instructions.