// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // to make migration to ts & raw eslint easier, should be enabled later
    'no-var-requires': 0,
    '@typescript-eslint/no-var-requires': 0,
    // this just straight up shouldn't be enabled by default
    '@typescript-eslint/ban-ts-comment': 0
  },
  env: {node: true}
}
