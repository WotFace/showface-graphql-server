const authenticate = require('./auth')
const { prisma } = require('../../generated/prisma') // can use context.db.($func()) but I dw to risk it bruh
const _ = require('lodash')

const Subscription = {

}

module.exports = {
    Subscription,
}