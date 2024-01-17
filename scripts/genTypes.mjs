import fs from 'fs'

const targetFile = './dist/types.d.ts';
let types = fs.readFileSync(targetFile, 'utf8')
const plugins = fs.readdirSync('./dist/lib/plugins').filter(f => f !== 'index')
types = plugins.filter(module => module.endsWith('.d.ts')).map(module => `import "./lib/plugins/${module}"`).join('\n') + '\n' + types
fs.writeFileSync(targetFile, types, 'utf8')
