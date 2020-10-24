# Contribute

## Architecture of the project

Directory architecture :

* app.js: specific settings and actually start the server
* dist/: Contains "compiled" code (go to current directory in console and type `gulp` to generate this)
* src/: Source files for the project
* src/index.js: contain the generic server implementation
* src/lib: contain the classes and functions used in the plugins
  * plugins/: All of the default plugins made to simulate vanilla
  * worldGenerations/: Contains default world generations, however plugins can use their own
  
## Structure of a plugin

```js

// Each of these are called an "inject" because you're injecting properties, events, methods, or data into the objects

module.exports.server = function(serv) { // Create your server events here
  serv.spawnPoint = ...
  serv.on('...', ...)
}

module.exports.entity = function(entity, serv) { // Called whenever an entity is created, do NOT do serv.on here
  entity.health = 10; // Start with 10 health out of 20
  entity.on('...', ...)
  // serv.on('...', ...); NOOOO
}

module.exports.player = function(player, serv) { // Player is a type of entity (entity inject is called first) with added properties and functions
  player.setXp(100); // Example of a property player entities have but not other entities
  player.on(',,,', ...)
  // serv.on('...', .– don't even think about it
}

```

## Logs and event

In order to keep logging independent from the rest of the server and to let people react in other ways than logging,
logging uses methods and events from `log.js`. These include `serv.log(message)` and `serv.emit('error', err)`.

## Creating external plugins

Create a new repo, which will be published to npm when ready to be used. Create a file (probably `index.js`) in which you use a similar format as above (module.exports.xxxx).

In these inject functions you can use everything documented in the [api.md](API.md).

Let's say you called your module fs-flying-horses and you published it to npm.

Now people can use install your plugin by simply typing:

```npm install fs-flying-horses```

### Testing your Plugin

For your convenience, you can put your plugin inside /src/plugins. An example might look like:
- src/plugins/
  - myPluginName/
    - index.js
    - package.json
    - node_modules
      - ...
  - myPluginName2.js (direct files are allowed but are impossible to publish, so it's best only to use them for testing)

## Docker

You can build Docker image locally like that (positionned in root directory):
```bash
docker build -t prismarinejs/flying-squid . -f deploy/Dockerfile
```

```bash
docker run -p 25565:25565 -v $(pwd)/config:/config --name my-flying-squid --rm prismarinejs/flying-squid
```

[docker-compose](https://docs.docker.com/compose/) is useful to quickly launch & stop a single container with a specific configuration, for a more production purpose, it is more frequent to deploy your container(s) in [Kubernetes](https://kubernetes.io) with [Helm](https://helm.sh).

```bash
docker-compose -f deploy/docker-compose.yaml up
```

## Conclusion

In this document, we explained how to create a simple plugin with just one file, but you can cut your code
in several files by having several inject function and putting them in different files, just like flying-squid does for its internal plugins.
