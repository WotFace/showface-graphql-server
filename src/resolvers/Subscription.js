const authenticate = require('./auth')
const { prisma } = require('../../generated/prisma') // can use context.db.($func()) but I dw to risk it bruh
const _ = require('lodash')

const Subscription = {
    show: {
        subscribe: async function (parent, { auth, where }, context, info) {
            return prisma.$subscribe.show({
                mutation_in: ['CREATED', 'DELETED', 'UPDATED']
            }).node()

            // try {
            //     // Prisma client apparently needs this fragment to retrieve nested obj
            //     const fragment = `
            //     fragment QueryShowOnShow on Show {
            //         mutation
            //         node {
            //           id
            //           slug
            //           name
            //           isPrivate
            //           isReadOnly
            //           areResponsesHidden
            //           startDate
            //           endDate
            //           interval
            //           createdAt
            //           respondents {
            //             id
            //             anonymousName
            //             user {
            //               id
            //               uid
            //               email
            //               name
            //               createdAt
            //             }
            //             role
            //             response
            //             createdAt
            //             updatedAt
            //           }
            //         }
            //         updatedFields
            //       }
            //     `

            //     // check if current user is really inside the show itself if the show is private
            //     if (show.isPrivate) {
            //         const user = await authenticate.verifyUser(auth.token, auth.uid)
            //         const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
            //         // return if show is private but user data is not there (means not invited)
            //         if (userData == null) {
            //             return null
            //         }
            //     }

            //     const showSubscription = await 

            //     return showSubscription
            // } catch (err) {
            //     console.log(err)
            //     return
            // }
        },
        resolve: function(payload) {
            return payload
        }
    }
}

module.exports = {
    Subscription,
}