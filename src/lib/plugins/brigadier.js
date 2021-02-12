'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const { CommandDispatcher, RootCommandNode, LiteralCommandNode, ArgumentCommandNode, CommandSyntaxException } = require('node-brigadier')
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
module.exports.player = (player, serv) => {
  const root = serv.brigadier.getRoot()
  const commandNodes = makeNodeMap(root)
  const jsonCommandNodes = []
  for (const nodeInt in commandNodes) {
    const node = commandNodes[nodeInt]
    const jsonNode = {}
    const flags = {
      unused: false,
      has_custom_suggestions: false,
      has_redirect_node: false,
      has_command: false,
      command_node_type: 0
    }
    if (node.redirect) {
      flags.has_redirect_node = true
      jsonNode.redirectNode = commandNodes.indexOf(node.redirectNode)
    }
    if (node.command) { flags.has_command = true }
    if (node instanceof RootCommandNode) {
      flags.command_node_type = 0
    } else if (node instanceof LiteralCommandNode) {
      flags.command_node_type = 1
      // @ts-expect-error
      jsonNode.extraNodeData = node.literal
    } else if (node instanceof ArgumentCommandNode) {
      flags.command_node_type = 2
      // @ts-expect-error
      if (node.args.size > 0) { flags.has_custom_suggestions = true }
      jsonNode.extraNodeData = {}
    }
    jsonNode.flags = flags
    const children = []
    for (const [_, childNode] of node.children) {
      children.push(commandNodes.indexOf(childNode))
    }
    jsonNode.children = children
    jsonCommandNodes.push(jsonNode)
  }
  player._client.write('declare_commands', {
    nodes: jsonCommandNodes,
    rootIndex: commandNodes.indexOf(root)
  })
  player.handleCommand = async (str) => {
    const parsedCommand = serv.brigadier.parse(str, {
      player: player
    })
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
