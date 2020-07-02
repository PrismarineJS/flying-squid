const _ = require("lodash");

module.exports.player = (player, serv) => {
    player._client.on('settings', (packet) => {
        player.lang = packet.locale
    })

    player.localeString = (path) => serv.locales.get(player.lang, path)
}

module.exports.server = (serv) => {
    serv.locales = {
        langs: {},
        getString(locale, path) {
            return _.get(this.langs[locale || 'en_us'], path.replace(/:/g, ".")) || ''
        },
        addString(locale, path, value) {
            this.langs[locale] = this.langs[locale] || {}
            _.set(this.langs[locale], path.replace(/:/g, "."), value)
        }
    }
}