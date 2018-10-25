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

            return user
        } catch (err) {
            console.log(err)
            return new Error("BadRequestError")
        }
    },

    // get one show's details
    show: async function (parent, { auth, where }, context, info) {
        try {
            // Prisma client apparently needs this fragment to retrieve nested obj
            const fragment = `
            fragment QueryShowOnShow on Show {
                id
                slug
                name
                isPrivate
                isReadOnly
                areResponsesHidden
                startTime
                endTime
                dates
                interval
                respondents {
                    id
                    user {
                        name
                        email
                    }
                    anonymousName
                    response
                    role
                }
                createdAt
            }
            `
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            // if show is private must check if there's a user with the name inside
            if (show.isPrivate) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function(a) { return (a.user ? a.user.email : false) == user.email })
                // return if show is private but user data is not there (means not invited)
                if (userData == null) {
                    return new Error("UserNotAuthorizedError")
                }
            }

            return show
        } catch (err) {
            console.log(err)
            return
        }
    },

    // get all of user's show
    userShows: async function (parent, { auth, first, skip }, context, info) {
        try {
            // user must be signed in and verified first
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment QueryShowOnShow on Show {
                id
                slug
                name
                isPrivate
                isReadOnly
                areResponsesHidden
                startTime
                endTime
                dates
                interval
                respondents {
                    id
                    user {
                        name
                        email
                    }
                    anonymousName
                    response
                    role
                }
                createdAt
            }
            `

            // we will not get the respondents here since that won't be economical
            // default is getting first 10 if first and skip not specified
            const userShows = await prisma.shows({
                where: {
                    respondents_some: {
                        user: { email: user.email }
                    }
                },
                first: first ? first : 10,
                skip: skip ? skip : 0,
                orderBy: "createdAt_DESC"
            }).$fragment(fragment)

            return userShows
        } catch (err) {
            console.log(err)
            return
        }
    }
}

module.exports = {
    Query,
}