const utils = {}

utils.resultOk = function (message) {
    return {
        status: 200,
        message: message
    }
}

module.exports = utils