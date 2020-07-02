const _ = require("lodash");

module.exports.player = (player, serv) => {
    player._client.on('settings', (packet) => {
        player.lang = packet.locale
    })

    player.localeString = (string) => serv.locales.get(string, player.lang)
}

module.exports.server = (serv) => {
    serv.locales = {
        langs: {},
        getString(locale, string) {
            return _.get(this.langs[locale || 'en_us'], string.replace(/:/g, ".")) || ''
        },
        addString(locale, stringName, stringValue) {
            this.langs[locale] = this.langs[locale] || {}
            _.set(this.langs[locale], stringName.replace(/:/g, "."), stringValue)
        }
    }
}