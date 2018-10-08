const { Query } = require('./Query')
const { Mutation } = require('./Mutation')
const { Subscription } = require('./Subscription')

const resolvers = {
  Query,
  Mutation,
  Subscription
}

module.exports = {
  resolvers,
}