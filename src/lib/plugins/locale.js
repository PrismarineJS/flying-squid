const _ = require("lodash");

module.exports.player = (player, serv) => {
    player._client.on('settings', (packet) => {
        player.lang = packet.locale
    })

    player.localeString = (path) => serv.localeString(player.lang, path)
}

module.exports.server = (serv) => {
    serv.locales = {
        langs: {},
        getString(lang = 'en_US', path) {
            const str = _.get(this.langs[lang], path)
            if (str !== undefined) return str['value']
            return `String \'${path}\' in \'${lang}\' not found`
        },
        addStringLang(lang, path, value) {
            this.langs[lang] = this.langs[lang] || {}
            _.set(this.langs[lang], path, { value: value })
        },
        addString(path, values) {
            Object.keys(values).map(lang => {
                let localPath = path
                let value = values[lang]
                this.langs[lang] = this.langs[lang] || {}
                _.set(this.langs[lang], localPath, { value: value })
            })
        }
    }

    serv.localeString = (lang, path) => serv.locales.getString(lang, path)

    serv.locales.addString('localeTest', {
        en_US: 'Localization works!',
        ru_RU: 'Локализация работает!'
    })

    serv.locales.addString('localeTest.inside', {
        en_US: 'Localization works inside localeTest!',
        ru_RU: 'Локализация работает внутри localeTest!'
    })

    serv.locales.addString('localeTest.object', {
        en_US: {
            hmm: 'Localization works.. hmm...'
        },
        ru_RU: {
            hmm: 'Локализация работает .. хммм'
        },
        ru_RU1: {
            hmm: 'Локализация работает .. хммм', 
            lol: {
                h: 'ehx'
            }
        }
    })

    serv.commands.add({
        base: 'localetest',
        info: 'Test localization',
        usage: '/localetest [lang] [where]',
        op: true,
        action(args, ctx) {
            let argsSplit = args.split(' ')
            const lang = argsSplit[0] === '' ? undefined : argsSplit[0]
            const path = 'localeTest' + (argsSplit[1] && argsSplit !== '' ? '.'+argsSplit[1] : '')

            if (ctx.player) {
                if (lang) ctx.player.chat(serv.localeString(lang, path))
                else ctx.player.chat(ctx.player.localeString(path))
            }
            else serv.info(serv.localeString(lang, path))
        }
    })
}