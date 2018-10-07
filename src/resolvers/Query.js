const authenticate = require('./auth')
const { prisma } = require('../../generated/prisma') // can use context.db.($func()) but I dw to risk it bruh
const _ = require('lodash')

// before production turn all prisma. to context.db.
// pls help me out a bit with the error handling stuff haha
const Query = {

    // get one user's details
    user: async function (parent, { auth }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)
            
            return {
                user
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // get one show's details
    show: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            // Prisma client apparently needs this fragment to retrieve nested obj
            const fragment = `
            fragment RespondentsOnShow on Show {
                id
                slug
                name
                isPrivate
                isAnonymous
                startDate
                endDate
                respondents {
                    user {
                        name
                        email
                    }
                    response
                    role
                }
                createdAt
            }
            `

            const show = await prisma.show({ slug: data.slug }).$fragment(fragment)
            // check if current user is really inside the show itself if the show is private
            if (show.isPrivate) {
                const userData = _.find(show.respondents, function(a) { return a.user.email == user.email })
                // return if show is private but user data is not there (means not invited)
                if (userData == null) {
                    return
                }
            }


            return {
                show
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // get all of user's show
    userShows: async function (parent, { auth, first, skip }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            // we will not get the respondents here since that won't be economical
            // default is getting first 10 if first and skip not specified

            const userShows = await prisma.shows({
                where: {
                    respondents_every: {
                        user: { email: user.email }
                    }
                },
                first: first ? first : 10,
                skip: skip ? skip : 0
            })

            return {
                userShows
            }
        } catch (err) {
            console.log(err)
            return
        }
    }
}

module.exports = {
    Query,
}