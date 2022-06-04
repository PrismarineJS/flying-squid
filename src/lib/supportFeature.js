const features = require('./features')

module.exports = (feature, version) => {
  for (const { name, versions } of features) {
    if (feature !== name) continue

    const supportsFeature = versions.some((featureVersion) => {
      if (featureVersion.endsWith('x') && featureVersion.startsWith(version.slice(0, -2))) return true

      if (featureVersion === version) return true

      return false
    })

    return supportsFeature
  };
}
