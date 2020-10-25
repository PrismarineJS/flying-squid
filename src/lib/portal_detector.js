const Vec3 = require('vec3').Vec3
const flatMap = require('flatmap')
const range = require('range').range

module.exports = (version) => {
  const World = require('prismarine-world')(version)
  const Chunk = require('prismarine-chunk')(version)
  const mcData = require('minecraft-data')(version)
  const obsidianType = mcData.blocksByName.obsidian.id

  async function findLineInDirection (world, startingPoint, type, direction, directionV) {
    const line = []
    let point = startingPoint
    while ((await world.getBlock(point)).name === type && (await world.getBlockType(point.plus(directionV))) === 0) {
      line.push(point)
      point = point.plus(direction)
    }
    return line
  }

  async function findLine (world, startingPoint, type, direction, directionV) {
    const firstSegment = (await findLineInDirection(world, startingPoint.plus(direction.scaled(-1)), type, direction.scaled(-1), directionV)).reverse()
    const secondSegment = await findLineInDirection(world, startingPoint, type, direction, directionV)
    return firstSegment.concat(secondSegment)
  }

  async function findPotentialLines (world, startingPoint, directionV) {
    const firstLineDirection = directionV.y !== 0
      ? [new Vec3(1, 0, 0), new Vec3(0, 0, 1)]
      : [new Vec3(0, 1, 0)]
    return (await Promise.all(firstLineDirection
      .map(async d => ({ direction: d, line: (await findLine(world, startingPoint, 'obsidian', d, directionV)) }))))
      .filter(line => (line.line.length >= 3 && line.direction.y !== 0) ||
      (line.line.length >= 2 && line.direction.y === 0))
  }

  function positiveOrder (line, direction) {
    if (direction.x === -1 || direction.y === -1 || direction.z === -1) { return line.reverse() }
    return line
  }

  async function findBorder (world, { line, direction }, directionV) {
    let bottom = line
    if (bottom.length === 0) { return [] }
    let left = await findLineInDirection(world, bottom[0].plus(direction.scaled(-1).plus(directionV)), 'obsidian', directionV, direction)
    let right = await findLineInDirection(world, bottom[line.length - 1].plus(direction).plus(directionV), 'obsidian',
      directionV, direction.scaled(-1))
    if (left.length === 0 || left.length !== right.length) { return null }
    let top = await findLineInDirection(world, left[left.length - 1].plus(direction).plus(directionV), 'obsidian',
      direction, directionV.scaled(-1))
    if (bottom.length !== top.length) { return null }

    left = positiveOrder(left, directionV)
    right = positiveOrder(right, directionV)
    top = positiveOrder(top, direction)

    if (direction.y !== 0) {
      [bottom, left, right, top] = [left, bottom, top, right]
    }

    [bottom, top] = directionV.y < 0 ? [top, bottom] : [bottom, top]
    const horDir = direction.x !== 0 || directionV.x !== 0 ? 'x' : 'z';
    [left, right] = direction[horDir] < 0 || directionV[horDir] < 0 ? [right, left] : [left, right]

    if (bottom.length < 2 || top.length < 2 || left.length < 3 || right.length < 3) { return null }

    return { bottom, left, right, top }
  }

  async function detectFrame (world, startingPoint, directionV) {
    const potentialLines = await findPotentialLines(world, startingPoint, directionV)

    return asyncFilter((await Promise.all(potentialLines
      .map(line => findBorder(world, line, directionV))))
      .filter(border => border !== null)
      .map(({ bottom, left, right, top }) => ({ bottom, left, right, top, air: getAir({ bottom, left, right, top }) })),
    async ({ air }) => isAllAir(world, air))
  }

  async function asyncEvery (array, pred) {
    return Promise.all(array.map(x => pred(x).then(y => y ? true : Promise.reject(false)))) // eslint-disable-line prefer-promise-reject-errors
      .then(results => true)
      .catch(x => false)
  }

  function asyncFilter (array, pred) {
    return Promise.all(array.map(e => pred(e).then(a => a ? e : null))).then(r => r.filter(a => a !== null))
  }

  async function isAllAir (world, blocks) {
    return asyncEvery(blocks, async block => (await world.getBlockType(block)) === 0)
  }

  function getAir (border) {
    const { bottom, top } = border
    return flatMap(bottom, pos => range(1, top[0].y - bottom[0].y).map(i => pos.offset(0, i, 0)))
  }

  function generateLine (startingPoint, direction, length) {
    return range(0, length).map(i => startingPoint.plus(direction.scaled(i)))
  }

  function generatePortal (bottomLeft, direction, width, height) {
    const directionV = new Vec3(0, 1, 0)
    return {
      bottom: generateLine(bottomLeft.plus(direction), direction, width - 2),
      left: generateLine(bottomLeft.plus(directionV), directionV, height - 2),
      right: generateLine(bottomLeft.plus(direction.scaled(width - 1)).plus(directionV), directionV, height - 2),
      top: generateLine(bottomLeft.plus(directionV.scaled(height - 1).plus(direction)), direction, width - 2),
      air: flatMap(generateLine(bottomLeft.plus(direction).plus(directionV), direction, width - 2),
        p => generateLine(p, directionV, height - 2))
    }
  }

  function addPortalToWorld (world, portal, additionalAir, additionalObsidian, setBlockType = null) {
    if (setBlockType === null) { setBlockType = world.setBlockType.bind(world) }
    const { bottom, left, right, top, air } = portal

    const p = flatMap([bottom, left, right, top], border => border.map(pos => setBlockType(pos, obsidianType)))
    p.push(air.map(pos => setBlockType(pos, 0)))

    p.push(additionalAir.map(pos => setBlockType(pos, 0)))
    p.push(additionalObsidian.map(pos => setBlockType(pos, obsidianType)))

    return Promise.all(p)
  }

  async function makeWorldWithPortal (portal, additionalAir, additionalObsidian) {
    const world = new World(() => new Chunk())
    await addPortalToWorld(world, portal, additionalAir, additionalObsidian)

    return world
  }

  return { detectFrame, findPotentialLines, findBorder, getAir, generateLine, generatePortal, addPortalToWorld, makeWorldWithPortal }
}
