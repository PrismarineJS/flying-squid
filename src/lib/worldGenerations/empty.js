function generation ({ version }) {
  const Chunk = require('prismarine-chunk')(version)
  return () => new Chunk()
}

module.exports = generation
