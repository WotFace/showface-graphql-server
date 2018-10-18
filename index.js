const { GraphQLServer } = require('graphql-yoga')
const { prisma } = require('./generated/prisma')
const { resolvers } = require('./src/resolvers')

const server = new GraphQLServer({
	typeDefs: 'src/schema.graphql',
	resolvers,
	context: req => {
		return {
			...req,
			db: prisma,
		}
	},
	// middlewares: // add middlewares here
})

server.start(() => console.log('Server is running on http://localhost:4000'))
