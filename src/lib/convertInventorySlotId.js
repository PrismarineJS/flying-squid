const replace = {
  100: 8, 101: 7, 102: 6, 103: 5, '-106': 45
}

function fromNBT (slotId) {
  let slot = slotId
  let returnSlotId = slotId
  if (returnSlotId < 0) {
    returnSlotId = String(returnSlotId)
  }
  if (slotId >= 0 && slotId < 9) {
    slot = 36 + slotId
  }
  return replace[returnSlotId] || slot
}

function toNBT (slotId) {
  let slot = slotId
  let returnSlotId = slotId
  if (returnSlotId < 0) {
    returnSlotId = String(returnSlotId)
  }
  const invertReplace = Object.assign({}, ...Object.entries(replace).map(([a, b]) => ({ [b]: a })))
  if (slotId >= 36 && slotId <= 44) {
    slot = slotId - 36
  }
  return invertReplace[returnSlotId] || slot
}

export { fromNBT, toNBT }
