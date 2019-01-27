/* eslint-env jest */

const plugins = require('../src/lib/utils/path').allPlugins

test('should have example plugin', () => {
  expect(plugins['third-example'].server).toBeInstanceOf(Function)
  expect(plugins['third-example'].player).toBeInstanceOf(Function)
})
