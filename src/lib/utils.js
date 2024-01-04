module.exports.skipMcPrefix = (name) => typeof name === 'string' ? name.replace(/^minecraft:/, '') : name
