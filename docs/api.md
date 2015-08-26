# API

## MCServer

### CraftyJS.createMCServer(options)

Create and return an instance of the class MCServer.

options is an object containing the settings

### Properties

#### serv.entityMaxId

Current maximum entity id

#### serv.playersConnected

Array of connected players

#### serv.uuidToPlayer

Object uuid to players

#### serv.world

The map

### Methods

### serv.login(client)

login `client`

### serv.createLog()

create the log file

### serv.log(message)

logs a `message`

### serv.otherClients(client)

return the other clients than `client`

### serv.writeOthers(client,packetName, packetFields)

write to other clients than `client` the packet `packetName` with fields `packetFields`

