// Adapted from https://github.com/stephenhandley/requireindex (under the MIT license)

const fs = require('fs')
const path = require('path')

module.exports = function (dir, basenames) {
  const requires = {}

  if (arguments.length === 2) {
    // If basenames argument is passed, explicitly include those files
    basenames.forEach(function (basename) {
      const filepath = path.resolve(path.join(dir, basename))
      requires[basename] = require(filepath)
    })
  } else if (arguments.length === 1) {
    // If basenames arguments isn't passed, require all JavaScript
    // Files (except for those prefixed with _) and all directories

    const files = fs.readdirSync(dir)

    // Sort files in lowercase alpha for Linux
    files.sort((a, b) => {
      a = a.toLowerCase()
      b = b.toLowerCase()

      if (a < b) {
        return -1
      } else if (b < a) {
        return 1
      } else {
        return 0
      }
    })

    files.forEach(filename => {
      // Ignore `index.js` and files prefixed with underscore and
      if ((filename === 'index.js') || (filename[0] === '_') || (filename[0] === '.')) {
        return
      }

      const filepath = path.resolve(path.join(dir, filename))
      const ext = path.extname(filename)
      const stats = fs.statSync(filepath)

      // Don't require non-javascript files (.txt, .md, etc.)
      if (stats.isFile() && !(['.js', '.node', '.json'].includes(ext))) {
        return
      }

      const basename = path.basename(filename, ext)

      requires[basename] = require(filepath)
    })
  } else {
    throw new Error('Must pass directory as first argument')
  }

  return requires
}
