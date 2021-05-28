const Vec3 = require('vec3').Vec3
const UserError = require('../user_error')

module.exports.player = function (player, serv, { version }) {
  const mcData = require('minecraft-data')(version)

  const obsidianType = mcData.blocksByName.obsidian.id
  const portalType = serv.supportFeature('theFlattening') ? mcData.blocksByName.nether_portal.id : mcData.blocksByName.portal.id

  player.on('dug', ({ position, block }) => {
    function destroyPortal (portal, positionAlreadyDone = null) {
      player.world.portals = player.world.portals.splice(player.world.portals.indexOf(portal), 1)
      portal
        .air
        .filter(ap => positionAlreadyDone === null || !ap.equals(positionAlreadyDone))
        .forEach(ap => serv.setBlock(player.world, ap, 0))
    }

    if (block.type === obsidianType) {
      const p = player.world.portals.filter(({ bottom, top, left, right }) =>
        [].concat(bottom, left, right, top)
          .reduce((acc, pos) => acc || pos.equals(position), false))
      p.forEach(portal => destroyPortal(portal, position))
    }

    if (block.type === portalType) {
      const p = player.world.portals.filter(({ air }) => air.reduce((acc, pos) => acc || pos.equals(position), false))
      p.forEach(portal => destroyPortal(portal, position))
    }
  })
}

module.exports.server = function (serv, { version }) {
  const { generatePortal, addPortalToWorld, detectFrame } = require('../portal_detector')(version)
  const mcData = require('minecraft-data')(version)

  const obsidianType = mcData.blocksByName.obsidian.id
  const fireType = mcData.blocksByName.fire.id

  let portalX
  let portalZ
  if (serv.supportFeature('theFlattening')) {
    const portalBlock = mcData.blocksByName.nether_portal
    portalX = portalBlock.minStateId
    portalZ = portalBlock.minStateId + 1
  } else {
    const portalBlock = mcData.blocksByName.portal
    portalX = portalBlock.id << 4 + 1
    portalZ = portalBlock.id << 4 + 2
  }

  serv.on('asap', () => {
    serv.onItemPlace('flint_and_steel', async ({ player, referencePosition, directionVector }) => {
      const block = await player.world.getBlock(referencePosition)
      if (block.type === obsidianType) {
        const frames = await detectFrame(player.world, referencePosition, directionVector)
        if (frames.length !== 0) {
          const air = frames[0].air
          const stateId = (frames[0].bottom[0].x - frames[0].bottom[1].x) !== 0 ? portalX : portalZ
          air.forEach(pos => {
            player.setBlock(pos, stateId)
          })
          player.world.portals.push(frames[0])
          return { id: -1, data: 0 }
        }
      }
      return { id: fireType, data: 0 }
    })
  })

  serv.commands.add({
    base: 'portal',
    info: 'Create a portal frame',
    usage: '/portal <bottomLeft:<x> <y> <z>> <direction:x|z> <width> <height>',
    onlyPlayer: true,
    op: true,
    parse (str, ctx) {
      const pars = str.split(' ')
      if (pars.length !== 6) { return false }
      let [x, y, z, direction, width, height] = pars;
      [x, y, z] = [x, y, z].map((val, i) => serv.posFromString(val, ctx.player.position[['x', 'y', 'z'][i]]))
      const bottomLeft = new Vec3(x, y, z)
      if (direction !== 'x' && direction !== 'z') { throw new UserError('Wrong Direction') }
      direction = direction === 'x' ? new Vec3(1, 0, 0) : new Vec3(0, 0, 1)
      return { bottomLeft, direction, width, height }
    },
    async action ({ bottomLeft, direction, width, height }, ctx) {
      if (width > 21 || height > 21) { throw new UserError('Portals can only be 21x21!') }
      const portal = generatePortal(bottomLeft, direction, width, height)
      await addPortalToWorld(ctx.player.world, portal, [], [], async (pos, type) => {
        await serv.setBlockType(ctx.player.world, pos, type)
      })
    }
  })
}
