const {
  CommandDispatcher,
  RootCommandNode,
  LiteralCommandNode,
  ArgumentCommandNode,
  CommandSyntaxException,
  string, bool, float, integer
} = require('node-brigadier')
// not exported by node-brigadier
const StringArgumentType = string().constructor
const BoolArgumentType = bool().constructor
const FloatArgumentType = float().constructor
const IntegerArgumentType = integer().constructor

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
  return {
    target: 'minecraft:entity',
    duration: 'brigadier:integer',
    command: 'brigadier:string',
    name: 'brigadier:string'
  }[node.name]
}
function getStringType (stringType) {
  return {
    words_with_underscores: 0,
    '"quoted phrase"': 1,
    'words with spaces': 2
  }[stringType]
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
      unused: 0,
      has_custom_suggestions: 0,
      has_redirect_node: 0,
      has_command: 0,
      command_node_type: 0
    }
    if (currNode.redirect) {
      flags.has_redirect_node = 1
      currNodeJson.redirectNode = allNodes.indexOf(currNode.redirect)
    }
    if (currNode.command) {
      flags.has_command = 1
    }
    if (currNode instanceof RootCommandNode) {
      flags.command_node_type = 0
    } else if (currNode instanceof LiteralCommandNode) {
      flags.command_node_type = 1
      currNodeJson.extraNodeData = currNode.literal
    } else if (currNode instanceof ArgumentCommandNode) {
      flags.command_node_type = 2
      flags.has_command = 1
      currNodeJson.extraNodeData = {
        name: currNode.getName(),
        parser: getParser(currNode)
      }
      if (currNode.type instanceof FloatArgumentType) {
        const props = { flags: {} }
        // max
        props.flags.unused = 0
        if (Number.isFinite(currNode.type.maximum)) {
          props.max = currNode.type.maximum
          props.flags.max_present = 1
        } else {
          props.flags.max_present = 0
        }
        // min
        if (Number.isFinite(currNode.type.maximum)) {
          props.flags.max_present = 1
          props.min = currNode.type.minimum
        } else {
          props.flags.min_present = 0
        }
        if (!Number.isFinite(currNode.type.maximum) && !Number.isFinite(currNode.type.minimum)) {
          props.unused = 1
        }
        currNodeJson.extraNodeData.properties = props
      }
      if (currNode.type instanceof StringArgumentType) {
        currNodeJson.extraNodeData.properties = getStringType(currNode.type.type)
      }
    }

    currNodeJson.flags = flags
    const children = []
    for (const [, childNode] of currNode.children) {
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
