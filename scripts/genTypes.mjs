import fs from 'fs'

const targetFile = './dist/types.d.ts';
let types = fs.readFileSync(targetFile, 'utf8')
const modules = fs.readdirSync('./dist/lib/modules').filter(f => f !== 'index')
types = modules.filter(module => module.endsWith('.d.ts')).map(module => `import "./lib/modules/${module}"`).join('\n') + '\n' + types
fs.writeFileSync(targetFile, types, 'utf8')
