/* eslint-env mocha */
globalThis.isMocha = true
const squid = require('flying-squid')
const PortalDetector = require('../src/lib/portal_detector')
const expect = require('expect').default

squid.testedVersions.forEach((testedVersion, i) => {
  const registry = require('prismarine-registry')(testedVersion)
  const version = registry.version

  const {
    detectFrame,
    findPotentialLines,
    findBorder,
    getAir,
    generateLine,
    generatePortal,
    makeWorldWithPortal
  } = PortalDetector(registry)

  const { Vec3 } = require('vec3')

  describe('generate portal ' + testedVersion + 'v', () => {
    it('generate a line', () => {
      expect(generateLine(new Vec3(3, 1, 1), new Vec3(1, 0, 0), 2)).toEqual([new Vec3(3, 1, 1), new Vec3(4, 1, 1)])
    })

    it('generate a portal', () => {
      expect(generatePortal(new Vec3(2, 1, 1), new Vec3(1, 0, 0), 4, 5)).toEqual({
        bottom: generateLine(new Vec3(3, 1, 1), new Vec3(1, 0, 0), 2),
        left: generateLine(new Vec3(2, 2, 1), new Vec3(0, 1, 0), 3),
        right: generateLine(new Vec3(5, 2, 1), new Vec3(0, 1, 0), 3),
        top: generateLine(new Vec3(3, 5, 1), new Vec3(1, 0, 0), 2),
        air: generateLine(new Vec3(3, 2, 1), new Vec3(0, 1, 0), 3).concat(generateLine(new Vec3(4, 2, 1), new Vec3(0, 1, 0), 3))
      })
    })
  })

  describe('detect portal ' + version.minecraftVersion, () => {
    const portalData = []

    portalData.push({
      name: 'simple portal frame x',
      bottomLeft: new Vec3(2, 1, 1),
      direction: new Vec3(1, 0, 0),
      width: 4,
      height: 5,
      additionalAir: [],
      additionalObsidian: []
    })

    portalData.push({
      name: 'simple portal frame z',
      bottomLeft: new Vec3(2, 1, 1),
      direction: new Vec3(0, 0, 1),
      width: 4,
      height: 5,
      additionalAir: [],
      additionalObsidian: []
    })

    portalData.push({
      name: 'big simple portal frame x',
      bottomLeft: new Vec3(2, 1, 1),
      direction: new Vec3(1, 0, 0),
      width: 10,
      height: 10,
      additionalAir: [],
      additionalObsidian: []
    })

    portalData.push({
      name: 'simple portal frame x with borders',
      bottomLeft: new Vec3(2, 1, 1),
      direction: new Vec3(1, 0, 0),
      width: 4,
      height: 5,
      additionalAir: [],
      additionalObsidian: [new Vec3(2, 1, 1), new Vec3(5, 1, 1), new Vec3(2, 6, 1), new Vec3(5, 6, 1)]
    })

    const { bottom, left, right, top, air } = generatePortal(new Vec3(2, 1, 2), new Vec3(1, 0, 0), 4, 5)

    portalData.push({
      name: '2 portals',
      bottomLeft: new Vec3(2, 1, 1),
      direction: new Vec3(1, 0, 0),
      width: 4,
      height: 5,
      additionalAir: air,
      additionalObsidian: [].concat(bottom, left, right, top)
    })

    portalData.push({
      name: 'huge simple portal frame z',
      bottomLeft: new Vec3(2, 1, 1),
      direction: new Vec3(0, 0, 1),
      width: 50,
      height: 50,
      additionalAir: [],
      additionalObsidian: []
    })

    portalData.forEach(({ name, bottomLeft, direction, width, height, additionalAir, additionalObsidian }) => {
      const portal = generatePortal(bottomLeft, direction, width, height)
      const { bottom, left, right, top, air } = portal
      describe('Detect ' + name, () => {
        const expectedBorder = { bottom, left, right, top }

        let world
        before(async function () {
          world = await makeWorldWithPortal(portal, additionalAir, additionalObsidian)
        })

        describe('detect potential first lines', () => {
          it('detect potential first lines from bottom left', async () => {
            const potentialLines = await findPotentialLines(world, bottom[0], new Vec3(0, 1, 0))
            expect(potentialLines).toContainEqual({
              direction,
              line: bottom
            })
          })

          it('detect potential first lines from bottom right', async () => {
            const potentialLines = await findPotentialLines(world, bottom[bottom.length - 1], new Vec3(0, 1, 0))
            expect(potentialLines).toContainEqual({
              direction,
              line: bottom
            })
          })

          it('detect potential first lines from top left', async () => {
            const potentialLines = await findPotentialLines(world, top[0], new Vec3(0, -1, 0))
            expect(potentialLines).toContainEqual({
              direction,
              line: top
            })
          })

          it('detect potential first lines from top right', async () => {
            const potentialLines = await findPotentialLines(world, top[top.length - 1], new Vec3(0, -1, 0))
            expect(potentialLines).toContainEqual({
              direction,
              line: top
            })
          })

          it('detect potential first lines from left top', async () => {
            const potentialLines = await findPotentialLines(world, left[left.length - 1], direction)
            expect(potentialLines).toEqual([{
              direction: new Vec3(0, 1, 0),
              line: left
            }])
          })

          it('detect potential first lines from right bottom', async () => {
            const potentialLines = await findPotentialLines(world, right[0], direction.scaled(-1))
            expect(potentialLines).toEqual([{
              direction: new Vec3(0, 1, 0),
              line: right
            }])
          })
        })

        describe('find borders', () => {
          it('find borders from bottom', async () => {
            const border = await findBorder(world, {
              direction,
              line: bottom
            }, new Vec3(0, 1, 0))
            expect(border).toEqual(expectedBorder)
          })

          it('find borders from top', async () => {
            const border = await findBorder(world, {
              direction,
              line: top
            }, new Vec3(0, -1, 0))
            expect(border).toEqual(expectedBorder)
          })

          it('find borders from left', async () => {
            const border = await findBorder(world, {
              direction: new Vec3(0, 1, 0),
              line: left
            }, direction)
            expect(border).toEqual(expectedBorder)
          })
          it('find borders from right', async () => {
            const border = await findBorder(world, {
              direction: new Vec3(0, 1, 0),
              line: right
            }, direction.scaled(-1))
            expect(border).toEqual(expectedBorder)
          })
        })

        describe('detect portals', () => {
          it('detect portals from bottom left', async () => {
            const portals = await detectFrame(world, bottom[0], new Vec3(0, 1, 0))
            expect(portals).toEqual([portal])
          })
          it('detect portals from top left', async () => {
            const portals = await detectFrame(world, top[0], new Vec3(0, -1, 0))
            expect(portals).toEqual([portal])
          })
          it('detect portals from right top', async () => {
            const portals = await detectFrame(world, right[right.length - 1], direction.scaled(-1))
            expect(portals).toEqual([portal])
          })
        })

        it('get air', () => {
          const foundAir = getAir(expectedBorder)
          expect(foundAir).toEqual(air)
        })
      })
    })
  }).timeout(120 * 1000)

  describe("doesn't detect non-portal " + version.minecraftVersion, () => {
    const portalData = []

    portalData.push({
      name: 'simple portal frame x with one obsidian in the middle',
      bottomLeft: new Vec3(2, 1, 1),
      direction: new Vec3(1, 0, 0),
      width: 5,
      height: 5,
      additionalAir: [],
      additionalObsidian: [new Vec3(4, 3, 1)]
    })

    portalData.forEach(({ name, bottomLeft, direction, width, height, additionalAir, additionalObsidian }) => {
      const portal = generatePortal(bottomLeft, direction, width, height)
      const { bottom, right, top } = portal
      describe("doesn't detect detect " + name, () => {
        let world
        before(async function () {
          world = await makeWorldWithPortal(portal, additionalAir, additionalObsidian)
        })

        describe("doesn't detect portals", () => {
          it("doesn't detect portals from bottom left", async () => {
            const portals = await detectFrame(world, bottom[0], new Vec3(0, 1, 0))
            expect(portals).toEqual([])
          })
          it("doesn't detect portals from top left", async () => {
            const portals = await detectFrame(world, top[0], new Vec3(0, -1, 0))
            expect(portals).toEqual([])
          })
          it("doesn't detect portals from right top", async () => {
            const portals = await detectFrame(world, right[right.length - 1], direction.scaled(-1))
            expect(portals).toEqual([])
          })
        })
      })
    })
  })
})
