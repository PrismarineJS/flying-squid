const {
  CommandDispatcher,
  RootCommandNode,
  LiteralCommandNode,
  ArgumentCommandNode,
  CommandSyntaxException
} = require('node-brigadier')

const requireIndex = require('../requireindex')
const path = require('path')
const plugins = requireIndex(path.join(__dirname))

module.exports.server = (serv) => {
  const dispatcher = new CommandDispatcher()
  serv.brigadier = dispatcher
  serv.on('asap', () => {
    Object.keys(plugins)
      .filter(pluginName => plugins[pluginName].brigadier !== undefined)
      .forEach(pluginName => plugins[pluginName].brigadier(dispatcher, serv))
  })
}
/**
 * @description Compiles a list of commands
 * @param {RootCommandNode} rootCommandNode node that has children
 * @returns {Array<RootCommandNode|LiteralCommandNode>} root node + children as an array
 */
function makeNodeMap (rootCommandNode) {
  const commandNodes = []
  const queue = []
  queue.push(rootCommandNode)
  let commandNode
  while (queue.length > 0) {
    commandNode = queue.shift()
    if (commandNodes.includes(commandNode)) { continue }
    commandNodes.push(commandNode)
    for (const nodeChild of commandNode.getChildren()) { queue.push(nodeChild) }
    if (commandNode.getRedirect() == null) { continue }
    queue.push(commandNode.getRedirect())
  }
  return commandNodes
}

function getParser (node) {
  if (node.name === 'target') {
    return 'minecraft:entity'
  }
}

const StringPropertiesMap = {
  words_with_underscores: 0,
  '"quoted phrase"': 1,
  'words with spaces': 2
}

function build (player, serv) {
  // get root node
  const root = serv.brigadier.getRoot()
  // make root node into array of children nodes
  const allNodes = makeNodeMap(root)
  const allNodesJson = []
  for (const ix in allNodes) {
    const currNode = allNodes[ix]
    const currNodeJson = {}
    const flags = {
      unused: false,
      has_custom_suggestions: false,
      has_redirect_node: false,
      has_command: false,
      command_node_type: 0
    }
    if (currNode.redirect) {
      flags.has_redirect_node = true
      currNodeJson.redirectNode = allNodes.indexOf(currNode.redirectNode)
    }
    if (currNode.command) {
      flags.has_command = true
    }
    if (currNode instanceof RootCommandNode) {
      flags.command_node_type = 0
    } else if (currNode instanceof LiteralCommandNode) {
      flags.command_node_type = 1
      currNodeJson.extraNodeData = currNode.literal
    } else if (currNode instanceof ArgumentCommandNode) {
      flags.command_node_type = 2
      flags.has_command = true
      currNodeJson.extraNodeData = {
        name: currNode.getName(),
        parser: getParser(currNode),
        properties: StringPropertiesMap[currNode.type.type] || 1
      }
    }

    currNodeJson.flags = flags
    const children = []
    for (const [_, childNode] of currNode.children) {
      children.push(allNodes.indexOf(childNode))
    }
    currNodeJson.children = children
    allNodesJson.push(currNodeJson)
  }

  player._client.write('declare_commands', {
    nodes: allNodesJson,
    rootIndex: allNodes.indexOf(root)
  })
}

module.exports.player = (player, serv) => {
  // send declare_command packet
  build(player, serv)
  player.handleCommand = async (str) => {
    // pass the player & server as context
    const parsedCommand = serv.brigadier.parse(str, { player, serv })
    try {
      serv.brigadier.execute(parsedCommand)
    } catch (ex) {
      if (ex instanceof CommandSyntaxException) {
        player.chat(serv.color.red + ex.getMessage())
      } else {
        throw ex
      }
    }
  }
}
