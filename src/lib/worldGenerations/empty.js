function generation ({ registry }) {
  const Chunk = require('prismarine-chunk')(registry)
  return () => new Chunk()
}

module.exports = generation
