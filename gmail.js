var
    _ = require('lodash'),
    axios = require('axios'),

    messagesUrl = 'https://www.googleapis.com/gmail/v1/users/me/messages',

    tokens = {
        access_token: 'ya29.xwF1DkKle7wvm5MFt8DMpH4qDW08zNBW6wjV1E2HWzKYYNbaPVErwYV5YjwlHlHJat3mxg',
        token_type: 'Bearer'
    },

    getHeaders = function(tokens) {
        return {
            'Authorization': [tokens.token_type, tokens.access_token].join(' '),
            'Content-Type': 'application/json'
        }
    },

    getBody = function(item) {
        var
            body = [
                "Hi",
                "I came across your listing on Craigslist (" + item.url + "), and would love to come check it out if it's still available.",
                "A bit about myself - I moved here from the midwest about 4 years ago. I work as a software engineer in Soma, and have been with my current employer for about 1.5 years now.",
                "In my free time, I enjoy cooking, exploring the various stairways and hills in the city, watching Martin Scorcese movies, and working on side projects.",
                "I'm a fairly laidback and easygoing guy, but at the same time, respectful of the area and people around me. I've never had any complaints from my previous landlords or housemates!",
                "If I missed anything, or if you have any other questions at all, please feel free to ask me. I look forward to hearing from you.",
                "PS: does the unit has a dishwasher and washer/dryer?"
            ],
            signature = ['Regards', 'Jashua'].join('\n')

        body.push(signature)
        return body.join('\n\n')
    },

    getMessage = function(item) {
        var
            obj = {
                'Content-Type': 'text/plain; charset="UTF-8"',
                'MIME-Version': 1.0,
                'Content-Transfer-Encoding': '7bit',
                to: item.email,
                subject: ['Craigslist listing', item.title].join(': ')
            },
            body = getBody(item),
            string = _.map(obj, function(val, key) {
                return [key, val].join(': ')
            }).concat(['\n', body]).join('\n')
        return new Buffer(string)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
    }

module.exports = {
    getSentMessages: function(url) {
        return axios.get(messagesUrl, {
            params: { q: url },
            headers: getHeaders(tokens)
        })
    },

    sendMail: function(item) {
        var url = [messagesUrl, 'send'].join('/')
        return axios.post(url,
            { raw: getMessage(item) },
            { headers: getHeaders(tokens) }
        )
    }
}
