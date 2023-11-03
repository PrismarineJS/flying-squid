export function skipMcPrefix (name) {
    return typeof name === 'string' ? name.replace(/^minecraft:/, '') : name
}
