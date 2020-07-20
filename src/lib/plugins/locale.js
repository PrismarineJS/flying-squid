const fs = require('fs')
const path = require('path')
const set = require('lodash.set')
const mkdirp = require('mkdirp')

let appdata = path.join(process.env.APPDATA, '.flying-squid')
mkdirp(appdata)

const LauncherDownload = require('minecraft-wrap').LauncherDownload
const ld = new LauncherDownload(path.join(appdata, 'temp'), process.platform)

const get = (object, path, value) => {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key)
  const pathArrayFlat = pathArray.flatMap(part => typeof part === 'string' ? part.split('.') : part)

  return pathArrayFlat.reduce((obj, key) => obj && obj[key], object) || value
}

function removeItemAll (arr, value) {
  var i = 0
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1)
    } else {
      ++i
    }
  }
  return arr
}

module.exports.player = (player, serv) => {
  player._client.on('settings', (packet) => {
    player.lang = packet.locale
  })

  player.localeString = (path, info) => serv.localeString(player.lang, path, info)
}

module.exports.server = (serv, options) => {
  serv.locales = {
    langs: {},
    setStringLang: (lang, path, value) => {
      serv.locales.langs[lang] = serv.locales.langs[lang] || {}
      set(serv.locales.langs[lang], path, value)
    },
    setStringLangs: (path, langsvalues) => {
      Object.keys(langsvalues).map(lang => {
        serv.locales.langs[lang] = serv.locales.langs[lang] || {}
        const value = langsvalues[lang]
        const localPath = path
        set(serv.locales.langs[lang], localPath, value)
      })
    },
    setStringJSON: (lang, json) => {
      serv.locales.langs[lang] = serv.locales.langs[lang] || {}
      Object.entries(json).map((entry) => {
        set(serv.locales.langs[lang], entry[0] + '.value', entry[1])
      })
    },
    getString: (lang, path, info) => {
      lang = lang || 'en_us'
      lang = serv.locales.langs[lang] ? lang : 'en_us'
      if (info) {
        var splitted = get(serv.locales.langs[lang], path, `'${path}' not found`).value.split(/(%s|%[0-9]\$s)/)
        var sindex = 0
        splitted.forEach((str, i) => {
          if (/(%s)/.test(str)) {
            splitted[i] = info[sindex]
            sindex++
          } else if (/(%[0-9]\$s)/.test(str)) {
            const iex = /(?!(\$s|%))([0-9]+)/.exec(str)[0] - 1
            splitted[i] = info[iex]
          }
        })
        return splitted.join('')
      } else return get(serv.locales.langs[lang], path, `'${path}' not found`).value
    }
  }

  serv.localeBroadcast = (message, { whitelist = serv.players, blacklist = [], system = false, localize = {} } = {}) => {
    if (whitelist.type === 'player') whitelist = [whitelist]

    whitelist.filter(w => blacklist.indexOf(w) === -1).forEach(player => {
      if (localize !== {}) {
        var nos = message.split(/(%s)/)
        // var splitted = message.split(/%s/)
        var sindex = 0

        nos.forEach((msg, i) => {
          if (/(%s)/.test(msg)) {
            var keys = Object.keys(localize)
            nos[i] = player.localeString(keys[sindex], Array.isArray(localize[keys[sindex]]) ? localize[keys[sindex]] : [localize[keys[sindex]]])
            sindex++
          }
        })

        message = removeItemAll(nos, '%s').join('')
      }

      if (typeof message === 'string') message = serv.parseClassic(message)

      if (!system) player.chat(message)
      else player.system(message)
    })
  }

  fs.readdir(path.join(appdata, 'locale/'+options.version), (err, files) => {
    mkdirp(path.join(appdata, 'locale/'+options.version))
    if (!files) {
      const assetsCurrent = []
      ld.getAssetIndex(options.version).then(assets => {
  
        Object.keys(assets.objects).forEach(asset => {
          if (/^(minecraft\/lang\/)/.test(asset)) {
            assetsCurrent.push(asset)
          }
        })
        downloadLangs(options.version, assetsCurrent)
      }).catch(err => {
        console.log(err)
      })
  
      const downloadLangs = (version, assets) => {
        assets.forEach(asset => {
          ld.getAsset(asset, version).then(r => {
            fs.readFile(r, { encoding: 'utf8' }, (err, data) => {
              if (err) console.error(err)
              fs.writeFileSync(path.join(appdata, 'locale/'+version+'/'+asset.split('/')[2]), data)
            })
          })
        })
  
        serv.info('Downloaded locales!')
      }
    }
  })

  fs.readdirSync(path.join(appdata, 'locale/'+options.version)).forEach(e => {
    fs.readFile(path.join(appdata, 'locale/'+options.version+'/'+e), {encoding: 'utf8'}, (err, data) => {
      if (err) console.error(err)
      else {
        var lang = e.split('.')[0],
        ext = e.split('.')[1]
        if (ext === 'lang') {
          var langData = data.split('\n'),
            newData = {}
          langData.forEach((str) => {
            var string = str.split('=')
            newData[string[0]] = string[1]
          })
          serv.locales.setStringJSON(lang, newData)
        } else if (ext === 'json') {
          var json = JSON.parse(data)
          serv.locales.setStringJSON(lang, json)
        }
      }
    })
  })

  serv.localeString = (lang, path, ...info) => serv.locales.getString(lang, path, ...info)

  serv.commands.add({
    base: 'localetest',
    info: 'Test localization',
    usage: '/localetest [where] [lang] [replace]',
    op: true,
    parse (args) {
      return args || false
    },
    action (args, ctx) {
      args = args.split(' ')
      const lang = args[1] === '' ? undefined : args[1]
      const path = args[0] || 'localeTest.works'
      const replace = args.slice(2)

      if (ctx.player) {
        if (lang) ctx.player.chat(serv.localeString(lang, path))
        else ctx.player.chat(ctx.player.localeString(path))
      } else console.log(serv.localeString(lang, path))
    }
  })
}
