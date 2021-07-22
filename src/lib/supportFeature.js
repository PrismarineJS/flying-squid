const features = require('./features')

const versionList = require('minecraft-data').versions.pc
const versionToIndex = Object.fromEntries(versionList.map((version, i) => [version.minecraftVersion, versionList.length - i]))
const nameToFeature = Object.fromEntries(features.map(feature => [feature.name, feature]))

const lastVersion = Infinity // Avoid to change a lot of lines in features.json every time a new version is supported

module.exports = (featureName, minecraftVersion) => {
  const feature = nameToFeature[featureName]
  if (feature === undefined) {
    throw new Error(`Feature ${feature} doesn't exist`)
  }

  const currentVer = versionToIndex[minecraftVersion]
  const minVer = versionToIndex[feature.versions[0]]
  const maxVer = versionToIndex[feature.versions[1]] || lastVersion

  if (currentVer === undefined) {
    throw new Error(`Version ${minecraftVersion} doesn't exist`)
  }
  if (minVer === undefined) {
    throw new Error(`Version ${feature.versions[0]} doesn't exist`)
  }

  return minVer <= currentVer && currentVer <= maxVer
}
