# Contribute

## Architecture of the project

Directory architecture :

* app.js: specific settings and actually start the server
* index.js: contain the generic server implementation
* lib/: contain the classes and functions used in the plugins
  * serverPlugins/: server plugins that do things general to the server, 
  properties and method are added to the server object in them
  * playerPlugins/: player plugins that do things for each player, properties and method are added to the player object in them
  
Structure of a server plugin:

```js
module.exports=inject;

function inject(serv)
{
  // add methods and properties to serv
}
```

Structure of a player plugin :

```js
module.exports=inject;

function inject(serv,player)
{
  // add methods and properties to player
  // you can use serv, but you shouldn't add things to it here
}
```

## Logs and event

In order to keep logging independent from the rest of the server and to let people react in other ways than logging,
server and player events should be emitting and the logging should only take place in response to these events
in log.js of playerPlugins or serverPlugins.

## Creating external plugins

When you're making an external plugin, create a repo and publish to NPM your code so others can use it.

However, if you simply want to fool around, create a folder, use `npm init`, and drag it into the "plugins" folder.

Your file's base should look like this:

```js
module.exports = inject;

function inject(serv, player, self, opt) {
    
}
```

- serv is the Server object. Use this to broadcast messages, set blocks, etc
- player is a Player object. You can make changes to the player or check for events from them.
- self is your plugin. You may need your plugin id, so you'll use `self.id`.
- opt is any options the server has while running.

Since the plugin is its own node module, you can install any other modules inside of it!

Checks the API.md for information about what events you can check for on the server or player!

## Creating external plugins OLD

Create a new repo, which will be published to npm when ready to be used.

Create a file in which you put an inject function like this :

```js
module.exports=init;

function init(flying-squid) {
  return inject;
}

function inject(serv)
{
  // add methods and properties to serv
}
```

In the init function, you can use anything flying-squid provide 
(see [index.js](https://github.com/mhsjlw/flying-squid/blob/master/index.js#L11)).

In the inject function you can use everything documented in the [api.md](api.md) to add functionalities to the serv object.

Let's say you called your module flying-horses and you published it to npm.

Now people can use your plugin that way : 

```js
var flyingSquid = require('flying-squid');
var flyingHorses = require('flying-horses')(flyingSquid);
var serv = flyingSquid.createMCServer(/* your options there */);
// install the plugin
flyingHorses(serv);
```

As explained in the first part of this file, flying-squid has 2 kinds of plugins: server plugins, and player plugins.
We've explained until now how to create a server plugin and to use it with flying-squid.

Within the same module, you can also create a player plugin. Here is the code you need to add to do that:

```js
serv.on("newPlayer",function(player){
  injectPlayer(serv,player);
});

function injectPlayer(serv,player)
{
  // add methods and properties to player
  // you can use serv, but you shouldn't add things to it here
}
```

In this document, we explained how to create a simple plugin with just one file, but you can cut your code
in several files by having several inject function and putting them in different files, just like flying-squid does for its internal plugins.
