var inspect = require('eyes').inspector({maxLength: false})

module.exports = {
    log: function(message) {
        console.log(inspect(message))
    }
}
