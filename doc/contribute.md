# Contribute

## Architecture of the project

Directory architecture :

* app.js : specific settings and actually start the server
* index.js : contain the generic server implementation
* lib/ : contain the classes and functions used in the plugins
  * serverPlugins/ : server plugins that do things general to the server, 
  properties and method are added to the server object in them
  * playerPlugins/ : player plugins that do things for each player, 
  properties and method are added to the player object in them
  
Structure of a server plugin :

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