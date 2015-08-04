var
    _ = require('lodash'),
    bacon = require('baconjs').Bacon,
    axios = require('axios'),
    parser = require('./parser'),
    gmail = require('./gmail'),
    logger = require('./logger'),

    base_url = 'https://sfbay.craigslist.org',
    urls = [
        'https://sfbay.craigslist.org/search/sfc/apa?nh=149&nh=110&nh=3&nh=4&nh=5&nh=6&nh=7&nh=8&nh=9&nh=11&nh=12&nh=13&nh=14&nh=15&nh=16&nh=10&nh=20&nh=24&nh=17&nh=18&nh=19&nh=21&nh=22&nh=23&nh=164&nh=25&nh=26&nh=27&nh=1&nh=28&nh=29&nh=2&nh=118&nh=114&nh=30&max_price=1600',
        'https://sfbay.craigslist.org/search/eby/apa?nh=46&nh=47&nh=48&nh=49&nh=112&nh=58&nh=59&nh=60&nh=61&nh=62&nh=63&nh=66&nh=64&max_price=1500',
        'https://sfbay.craigslist.org/search/pen/apa?&nh=75&nh=80&nh=86&nh=89&max_price=1500'
    ],
    keywords = [],//['1br', 'studio'],

    containsKeyword = function(title, keywords) {
        var obj = _.find(keywords, function(keyword) {
            return title.indexOf(keyword) > -1
        })
        return keywords.length > 0 && !obj ? false : true
    },

    run = function() {
        var stream = bacon.fromArray(urls)
            .flatMap(function(url) {
                return bacon.fromPromise(axios.get(url))
            })
            .flatMap(function(resp) {
                return bacon.fromArray(parser.parseListingsList(resp.data))
            })
            .filter(function(item) {
                return containsKeyword(item.title.toLowerCase(), keywords)
            })
            .flatMapWithConcurrencyLimit(50, function(item) {
                var promise = gmail.getSentMessages(item.url)
                    .then(function(resp) {
                        return _.extend(item, {
                            messages: resp.data.messages
                        })
                    })
                return bacon.fromPromise(promise)
            })
            .filter(function(item) {
                return !item.messages
            })
            .flatMap(function(item) {
                var url = [base_url, item.url].join('')
                return bacon.fromPromise(axios.get(url))
            })
            .map(function(resp) {
                return parser.parseListingDetails(resp.data)
            })
            .flatMap(function(item) {
                var url = [base_url, item.reply_url].join('')
                var promise = axios.get(url)
                    .then(function(resp) {
                        return {
                            title: item.title,
                            url: item.url,
                            email: parser.parseListingEmail(resp.data)
                        }
                    })
                return bacon.fromPromise(promise)
            })
            .filter(function(item) {
                return item.email.length > 0
            })
            .flatMapWithConcurrencyLimit(50, function(item) {
                return bacon.fromPromise(gmail.sendMail(item))
            })
            .map(function(resp) {
                return resp.data
            })

        stream.onValue(function(val) {
            logger.log(val)
        })
        stream.onError(function(error) {
            logger.log(error)
        })
        stream.onEnd(function() {
            logger.log('end')
        })
    }

run()
