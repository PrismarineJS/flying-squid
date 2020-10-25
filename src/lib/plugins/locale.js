const fs = require('fs')
const path = require('path')
const set = require('lodash.set')
const mkdirp = require('mkdirp')

const appdata = path.join(process.env.APPDATA, '.flying-squid')
mkdirp(appdata)

const tempFolder = path.join(appdata, 'temp')

const LauncherDownload = require('minecraft-wrap').LauncherDownload
const ld = new LauncherDownload(tempFolder, process.platform)

function format(string, ...replacers) {
  var splittedString = string.split(/(%s|%[\d+]\$s)/)
  var sindex = 0
  splittedString.forEach((str, i) => {
    if (/(%s)/.test(str)) {
      splittedString[i] = replacers[sindex]
      sindex++
    } else if (/%(\d+)\$s/.test(str)) {
      const replaceIndex = /%(\d+)\$s/.exec(str)[1] - 1
      splittedString[i] = replacers[replaceIndex]
    }
  })
  return splittedString.join('')
}

class LocaleManager {
  constructor() {
    this.langs = {}
    this.players = {}
  }
  setStringLang = (lang, path, value) => {
    this.langs[lang] = this.langs[lang] || {}
    set(this.langs[lang], path, value)
  }
  setStringLangs = (path, langsvalues) => {
    Object.keys(langsvalues).forEach(lang => {
      this.langs[lang] = this.langs[lang] || {}
      const value = langsvalues[lang]
      const localPath = path
      this.langs[lang][localPath] = value
    })
  }
  setStringJSON = (lang, json) => {
    this.langs[lang] = json
  }
  getString = (locale, path, ...replacers) => {
    // locale = this.langs[locale] ? locale : 'en_us'
    try {
      let string = this.langs[locale][path]

      if (replacers) return format(string, ...replacers)
      else return string
    } catch(e) {
      console.log(e)
      return path
    }
  }
  setPlayerLocale(uuid, locale) {
    this.players[uuid] = locale || 'en_us'
  }
  getPlayerLocale(uuid) {
    return this.players[uuid] || 'en_us'
  }
}

module.exports.player = (player, serv) => {
  player.setLocale = (locale) => {
    player.locale = locale
  }

  player.setLocale(serv.localeManager.getPlayerLocale(player._client.uuid))

  player._client.on('settings', packet => {
    serv.localeManager.setPlayerLocale(player._client.uuid, packet.locale)
    player.setLocale(serv.localeManager.getPlayerLocale(player._client.uuid))
  })

  player.localeString = (path, ...info) => serv.localeString(player.locale, path, ...info)
}

module.exports.server = async (serv, options) => {
  serv.localeManager = new LocaleManager()

  serv.localeString = (lang, path, ...info) => serv.localeManager.getString(lang, path, ...info)

  async function loadLang(lang, data) {
    data = JSON.stringify(data)
    let dataToLoad = {}

    if (/.+=.+/gm.test(data)) {
      const langData = data.split(/\\n/)
      let dataFromLang = {}
      langData.forEach((str) => {
        const [path, val] = str.split('=')
        dataFromLang[path] = val
      })

      dataToLoad = dataFromLang
    } else {
      dataToLoad = JSON.parse(JSON.stringify(data))
    }

    serv.localeManager.setStringJSON(lang, dataToLoad)
    // serv.debug(`Loaded locale ${lang}`)
  }

  async function loadLangs() {
    fs.readdir(path.join(appdata, 'locale/' + options.version), (err, files) => {
      if (err) console.error(err)
      else {
        files.forEach(e => {
          fs.readFile(path.join(appdata, 'locale/' + options.version + '/' + e), { encoding: 'utf8' }, (err, data) => {
            if (err) console.error(err)
            else {
              const [lang, ext] = e.split('.')

              loadLang(lang, data)
            }
          })
        })
      }
    })
  }

  function downloadLangs(assets) {
    let version = options.version

    assets.forEach(asset => {
      ld.getAsset(asset, version).then(r => {
        fs.readFile(r, { encoding: 'utf8' }, (err, data) => {
          if (err) console.error(err)

          let [lang, ext] = asset.split('/')[2].split('.')

          fs.writeFileSync(path.join(appdata, 'locale/' + version + '/' + asset.split('/')[2]), data)
          loadLang(lang, data)
        })
      })
    })

    let en_us = require('minecraft-data')(version).language
    loadLang('en_us', en_us)
    fs.writeFileSync(path.join(appdata, 'locale/' + version + '/en_us.json'), en_us)

    serv.debug('Downloaded locales!')
  }

  let b = new Promise((resolve, reject) => {
    mkdirp(path.join(appdata, 'locale/' + options.version))
    fs.readdir(path.join(appdata, 'locale/' + options.version), async (err, files) => {
      if (err || !files || files.length < 1) resolve(false)
      else resolve(true)
    })
  })

  b.then(async isDownloaded => {
    if (!isDownloaded) {
      const langAssets = []

      let assets = await ld.getAssetIndex(options.version)
      Object.keys(assets.objects).forEach(asset => {
        if (/^(minecraft\/lang\/)/.test(asset)) langAssets.push(asset)
      })

      await downloadLangs(langAssets)
    }
  }).then(async e => {
    await loadLangs()
  }).catch(err => {
    console.log(err)
  })

  serv.commands.add({
    base: 'localetest',
    info: 'Test localization',
    usage: '/localetest [lang] [path] [replacers]',
    op: true,
    parse (args) {
      args = args.split(' ')
      if (!args[0] || !args[1]) return false
      if (!serv.localeManager.langs[args[0]]) return 'Language ' + args[0] + ' is not found'

      return args || false
    },
    action ([lang, path, ...replacers], ctx) {
      if (ctx.player) {
        if (lang) ctx.player.chat(serv.localeString(lang, path, replacers))
        else ctx.player.chat(ctx.player.localeString(path, replacers))
      } else console.log(serv.localeString(lang, path, replacers))
    }
  })

  serv.commands.add({
    base: 'test',
    action([], ctx) {
      ctx.player.chat({
        translate: 'multiplayer.player.joined'
      })
    }
  })
}
