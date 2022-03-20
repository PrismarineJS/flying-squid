import features from './features'

export default (feature, version) =>
  features.some(({ name, versions }) => name === feature && versions.includes(version))
