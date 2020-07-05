const get = (object, path, value) => {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key)
  const pathArrayFlat = pathArray.flatMap(part => typeof part === 'string' ? part.split('.') : part)

  return pathArrayFlat.reduce((obj, key) => obj && obj[key], object) || value
}

const set = (obj, path, value) => {
  if (Object(obj) !== obj) return obj // When obj is not an object
  // If not yet an array, get the keys from the string-path
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []
  path.slice(0, -1).reduce((a, c, i) => { // Iterate all of them except the last one
    if (Object(a[c]) === a[c]) {
      return a[c]
    } else {
      var cvcv = a[c] = Math.abs(path[i + 1]) >> 0
      if (cvcv === +path[i + 1]) {
        return []
      } else {
        return {}
      } // Yes: assign a new array object // No: assign a new plain object
    }
  }, obj)[path.pop()] = value // Finally assign the value to the last key

  return obj // Return the top-level object to allow chaining
}

module.exports.player = (player, serv) => {
  player._client.on('settings', (packet) => {
    player.lang = packet.locale
  })

  player.localeString = (path) => serv.localeString(player.lang, path)
}

module.exports.server = (serv) => {
  serv.locales = {
    langs: {},
    setStringLang (lang, path, value) {
      serv.locales.langs[lang] = serv.locales.langs[lang] || {}
      set(serv.locales.langs[lang], path, { value: value })
    },
    setString: (path, values) => {
      Object.keys(values).map(lang => {
        serv.locales.langs[lang] = serv.locales.langs[lang] || {}
        const value = values[lang]
        const localPath = path
        set(serv.locales.langs[lang], localPath, value)
      })
    },
    getString: (lang = 'en_US', path) => {
      return get(serv.locales.langs[lang], path, `'${path}' not found`)
    }
  }

  serv.localeString = (lang, path) => serv.locales.getString(lang, path)

  serv.locales.setString('localeTest', {
    en_US: {
      works: 'Localization works!',
      object: {
        hmm: 'Localization works.. hmm...'
      },
      array: ['It works!', 'I\'m array!']
    },
    ru_RU: {
      works: 'Локализация работает!',
      object: {
        hmm: 'Локализация работает.. хмм...'
      },
      array: ['Работает!', 'Я массив!']
    }
  })

  serv.commands.add({
    base: 'localetest',
    info: 'Test localization',
    usage: '/localetest [lang] [where]',
    op: true,
    action (args, ctx) {
      const argsSplit = args.split(' ')
      const lang = argsSplit[0] === '' ? undefined : argsSplit[0]
      const path = 'localeTest' + (argsSplit[1] && argsSplit !== '' ? '.' + argsSplit[1] : '')

      if (ctx.player) {
        if (lang) ctx.player.chat(serv.localeString(lang, path))
        else ctx.player.chat(ctx.player.localeString(path))
      } else serv.info(serv.localeString(lang, path))
    }
  })
}
