function generation ({ version }) {
  const Chunk = require('prismarine-chunk')(version)
  const registry = require('prismarine-registry')(version)
  return () => registry.supportFeature('tallWorld') ? new Chunk({ minY: -64, worldHeight: 384 }) : new Chunk()
}

module.exports = generation
