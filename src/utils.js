const utils = {}

utils.resultOk = function (message) {
    return {
        status: 200,
        message: message
    }
}

utils.resultError = function(errCode, message) {
    return {
        status: errCode,
        message: message
    }
}

module.exports = utils