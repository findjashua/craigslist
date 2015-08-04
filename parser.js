var
    _ = require('lodash'),
    cheerio = require('cheerio'),

    getFromMetaByProperty = function(meta, property) {
        return _.find(meta, function(item) {
            return item.attribs.property === property
        }).attribs.content
    }

module.exports = {
    parseListingsList: function(data) {
        var $ = cheerio.load(data)
        return _.map($('.hdrlnk'), function(item) {
            return {
                title: item.children[0].data,
                url: item.attribs.href
            }
        })
    },

    parseListingDetails: function(data) {
        var $ = cheerio.load(data)
        return {
            title: getFromMetaByProperty($('meta'), 'og:title'),
            url: getFromMetaByProperty($('meta'), 'og:url'),
            reply_url: $('#replylink').attr('href')
        }
    },

    parseListingEmail: function(data) {
        var $ = cheerio.load(data)
        return $('.anonemail').text()
    }
}
