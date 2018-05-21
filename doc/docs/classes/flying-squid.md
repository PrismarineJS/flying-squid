# flying_squid

## Classes

### Entity

### flying_squid.Command

### flying_squid.Behavior

## Libs

Collections of pure functions

### flying_squid.generations

### flying_squid.version

### flying_squid.experience

#### getXpLevel(xp)

Get level given XP amount

#### getXpRequired(level, toLevel=level+1)

Get's the amount of xp required to get from level to toLevel (or level to level+1)

#### getBaseXpFromLevel(level)

Gets the minimum amount of xp required to be at that level (or "base xp" for that level)

#### distanceToXpLevel(xp, toLevel=startLevel+1, startLevel=xp level)

Gets a number between 0 and 1 (used in player.displayXp as the green bar at the bottom) that is the progress of xp between startLevel and toLevel.

By default, startLevel will be the xp's lowest possible level: getXpLevel(xp)

By default, toLevel is startLevel + 1.

This means when startLevel and toLevel are at their defaults, this function returns the progress to the next level of XP (from 0.0 to 1.0)