module.exports = { distanceToXpLevel, getXpLevel, getXpRequired, getBaseXpFromLevel }

function distanceToXpLevel (xp, toLevel) {
  const level = getXpLevel(xp)
  if (!toLevel) toLevel = level + 1
  const levelBaseXp = getBaseXpFromLevel(level)
  const requiredXp = getXpRequired(level, toLevel)
  return (xp - levelBaseXp) / requiredXp
}

function getXpLevel (xp) {
  // I have to use quadratic equation to reverse the equation from getBaseXpFromLevel(). Ugh.
  let a
  let b
  let c
  if (xp < 352) { // 352 === Experience at level 16
    a = 1
    b = 6
    c = 0
  } else if (xp < 1507) { // 1507 === Experience at level 31
    a = 2.5
    b = -40.5
    c = 360
  } else { // Level 32+
    a = 4.5
    b = -162.5
    c = 2220
  }
  c -= xp
  return Math.floor((-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)) // Math class was useful I guess mmph
}

function getXpRequired (level, toLevel) {
  if (!toLevel) toLevel = level + 1
  return getBaseXpFromLevel(toLevel) - getBaseXpFromLevel(level)
}

function getBaseXpFromLevel (level) {
  // The equations in this function are stupid and directly from the MC Wiki
  // http://minecraft.gamepedia.com/Experience#Leveling_up
  if (level <= 16) {
    return level * level + 6 * level
  } else if (level <= 31) {
    return 2.5 * level * level - 40.5 * level + 360
  } else { // 32+
    return 4.5 * level * level - 162.5 * level + 2220
  }
}
