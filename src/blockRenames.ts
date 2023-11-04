
// postflatenning
const blockItemRenames = {
  "1.13.2": {
    "blocks": [],
    "items": [
    ]
  },
  "1.14": {
    "blocks": [],
    "items": [
      ["sign", "oak_sign"],
      ["rose_red", "red_dye"],
      ["cactus_green", "green_dye"],
      ["dandelion_yellow", "yellow_dye"]
    ]
  },
  "1.14.4": {
    "blocks": [
      ["sign", "oak_sign"],
      ["wall_sign", "oak_wall_sign"]
    ],
    "items": [
    ]
  },
  "1.15.2": {
    "blocks": [],
    "items": []
  },
  "1.16.1": {
    "blocks": [],
    "items": [
      ["zombie_pigman_spawn_egg", "zombified_piglin_spawn_egg"]
    ]
  },
  "1.16.2": {
    "blocks": [],
    "items": [
    ]
  },
  "1.17": {
    "blocks": [
      ["grass_path", "dirt_path"],
    ],
    "items": [
      ["grass_path", "dirt_path"],
    ]
  },
  "1.18": {
    "blocks": [],
    "items": [
    ]
  },
  "1.19": {
    "blocks": [],
    "items": []
  },
  "1.19.3": {
    "blocks": [],
    "items": []
  },
  "1.19.4": {
    "blocks": [],
    "items": []
  },
  "1.20": {
    "blocks": [],
    "items": [
      ["pottery_shard_archer", "archer_pottery_sherd"],
      ["pottery_shard_prize", "prize_pottery_sherd"],
      ["pottery_shard_arms_up", "arms_up_pottery_sherd"],
      ["pottery_shard_skull", "skull_pottery_sherd"]
    ]
  }
}

const versionToNumber = (ver: string) => {
  const [x, y = '0', z = '0'] = ver.split('.')
  return +`${x.padStart(2, '0')}${y.padStart(2, '0')}${z.padStart(2, '0')}`
}

const allRenamesMapFromLatest = Object.fromEntries(
  ['blocks', 'items'].map(x =>
    [
      x,
      Object.fromEntries(Object.entries(blockItemRenames).flatMap(([ver, t]) => t[x].map(([oldName, newName]) => [
        newName,
        { version: versionToNumber(ver), oldName }
      ])))
    ])
) as { [thing: string]: Record<string, { version: number, oldName: string }> }

export const adoptBlockOrItemNamesFromLatest = (type: 'blocks' | 'items', version: string, names: string[]) => {
  const map = allRenamesMapFromLatest[type]
  const ver = versionToNumber(version)
  return names.map(name => {
    const renamed = map[name] // todo it might be useful if followed by chain
    if (renamed && ver < renamed.version) {
      return renamed.oldName
    }
    return name
  })
}
