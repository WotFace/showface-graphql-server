// db replace with context in production
const { prisma } = require('../../generated/prisma')

// extensible auth middleware
const authenticate = require('./auth')

// libraries
const _ = require('lodash')
const randomWords = require('../utils/random-words')

// utils
const utils = require('../utils/utils')
const mail = require('../utils/nodemailer')

// before production turn all prisma. to context.db. for explicitness
const Mutation = {

    // creating a new user
    createUser: async function (parent, { auth, data }, context, info) {
        try {
            // authenticate firebase user first see if they're alive, might need to change the middleware though
            const decodedToken = await authenticate.verifyUserForSignUp(auth.token, auth.uid)

            if (decodedToken.email != data.email) {
                throw new Error("AuthenticationError")
            }

            const userData = _.merge(data, { uid: auth.uid })

            const createUser = await prisma.upsertUser({
                where: { email: data.email },
                create: userData,
                update: userData
            })

            return createUser
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // editing a user's settings
    editUserSettings: async function (parent, { auth, data }, context, info) {
        try {
            // need to be logged in to change user's settings
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const updateUser = await prisma.updateUser({
                where: { email: user.email },
                data: data
            })

            // we don't need to catch a few errors here because our
            // schema catches them and the data field would be null
            return updateUser
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // creating some new show
    createNewShow: async function (parent, { auth, data }, context, info) {
        try {
            const randomUniqueSlug = randomWords({ exactly: 5, join: '-' })

            const fragment = `
            fragment CreateNewShowOnShow on Show {
                id
                slug
                name
                interval
                areResponsesHidden
                startTime
                endTime
                dates
                isPrivate
                isReadOnly
                respondents {
                    id
                    anonymousName
                    user {
                        id
                        uid
                        email
                        name
                        isPremium
                        createdAt
                    }
                    role
                    response
                    isKeyRespondent
                    createdAt
                    updatedAt
                }
                createdAt
                updatedAt
            }
            `
            if (data.dates.length == 0) {
                throw new Error("UnprocessableEntityError: at least one date must be chosen")
            }
            // if auth exists, means that the user must be verified before being
            // able to create a show
            data = _.update(data, "dates", function (a) { return { set: a } })

            if (auth != null) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)

                const showData = _.merge(data, {
                    slug: randomUniqueSlug,
                    respondents: {
                        create: {
                            user: {
                                connect: { email: user.email }
                            },
                            role: "admin"
                        }
                    }
                })

                const createNewNonAnonymousShow = await prisma.createShow(showData).$fragment(fragment)

                return createNewNonAnonymousShow
            } else {
                // but if auth is null, then the user is probably not signed in
                // then show will be created anonymously, without any users with email privileges
                const showData = _.merge(data, {
                    slug: randomUniqueSlug,
                })

                const createNewAnonymousShow = await prisma.createShow(showData).$fragment(fragment)

                return createNewAnonymousShow
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // editing some show's settings
    editShowSettings: async function (parent, { auth, where, data }, context, info) {
        try {
            // find if at least one of the members is an admin to check whether show is anonymous
            const adminExists = await prisma.$exists.show({ slug: where.slug, respondents_some: { role: "admin" } })

            // if auth exists and the show is created anonymously, then handle accordingly
            if (adminExists) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)

                const userIsAdmin = await prisma.$exists.show({
                    slug: where.slug,
                    respondents_some: {
                        user: { email: user.email },
                        role: "admin"
                    }
                })

                if (!userIsAdmin) {
                    throw new Error("UserNoPrivilegeError")
                }

                if (data.dates) {
                    if (data.dates.length == 0) {
                        throw new Error("UnprocessableEntityError: at least one date must be chosen")
                    }
                    data = _.update(data, 'dates', function (a) { return { set: a } })
                }

                const editShowWithAdmin = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: data
                })

                return editShowWithAdmin
            } else {
                var showData = _.omit(data, ['isReadOnly', 'isPrivate', 'areResponsesHidden'])

                if (showData.dates) {
                    if (showData.dates.length == 0) {
                        throw new Error("UnprocessableEntityError: at least one date must be chosen")
                    }
                    showData = _.update(showData, 'dates', function (a) { return { set: a } })
                }

                const editShowWithoutAdmin = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: showData
                })

                return editShowWithoutAdmin
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // deleting a show
    deleteShow: async function (parent, { auth, where }, context, info) {
        try {
            const adminExists = await prisma.$exists.show({ slug: where.slug, respondents_some: { role: "admin" } })

            // check if user has authentication and show is not created anonymously
            if (adminExists) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)

                const userIsAdmin = await prisma.$exists.show({
                    slug: where.slug,
                    respondents_some: {
                        user: { email: user.email },
                        role: "admin"
                    }
                })

                if (!userIsAdmin) {
                    throw new Error("UserNoPrivilegeError")
                }

                const deleteShow = await prisma.deleteShow({ slug: where.slug })

                return utils.resultOk("Successfully deleted show " + where.slug)
            } else {
                return utils.resultError(401, "Unauthorized")
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // editing existing respondents' status (e.g. changing to admin)
    editShowRespondentStatus: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment EditRespondentsOnShow on Show {
                id
                slug
                name
                interval
                areResponsesHidden
                startTime
                endTime
                dates
                isPrivate
                isReadOnly
                respondents {
                    id
                    anonymousName
                    user {
                        id
                        uid
                        email
                        name
                        isPremium
                        createdAt
                    }
                    role
                    response
                    isKeyRespondent
                    createdAt
                    updatedAt
                }
                createdAt
                updatedAt
            }
            `

            if (!data.role && data.isKeyRespondent == null) {
                throw new Error("BadRequestError: at least one of the fields cannot be null")
            }

            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)
            // I didn't use the $exists from prisma because it will take me about 5 db queries, instead of 3 using this
            const adminExists = _.find(show.respondents, function (a) { return a.role == 'admin' })

            if (adminExists) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                if (userData.role != "admin") {
                    throw new Error("UserNoPrivilegeError")
                }

                const respondentData = _.find(show.respondents, function (a) { return a.id == where.id })

                // if the specified user is not a signed in user, then cannot be admin
                if (!respondentData.user) {
                    throw new Error("UserNoPrivilegeError")
                }

                if (data.role && (data.role != 'admin' || data.role != 'member')) {
                    throw new Error("UnprocessableEntityError")
                }

                updateUserStatus = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        updateDummy: Math.random(),
                        respondents: {
                            update: {
                                where: { id: respondentData.id },
                                data: data
                            }
                        }
                    }
                }).$fragment(fragment)

                return updateUserStatus
            } else {
                throw new Error("UserNoPrivilegeError")
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // adding respondents
    addRespondentsByEmail: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment AddRespondentsOnShow on Show {
                id
                slug
                name
                interval
                areResponsesHidden
                startTime
                endTime
                dates
                isPrivate
                isReadOnly
                respondents {
                    id
                    anonymousName
                    user {
                        id
                        uid
                        email
                        name
                        isPremium
                        createdAt
                    }
                    role
                    response
                    isKeyRespondent
                    createdAt
                    updatedAt
                }
                createdAt
                updatedAt
            }
            `
            // check if current requesting user is admin of current show
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            // using $exists will take 2 extra db queries
            const adminExists = _.find(show.respondents, function (a) { return a.role == 'admin' })

            // this feature is not for shows which have been created anonymously
            // first check whether show is anonymous first
            if (adminExists) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                // check if user is admin of show
                if (userData.role != 'admin') {
                    throw new Error("UserNoPrivilegeError")
                }

                // what I'm doing here is to return an array of all the emails so I can get a list of 
                // the invited emails
                respondentEmails = data.map(function (a) {
                    return a.email
                })

                // here I'm getting a list of registered users in the list of email
                const users = await prisma.users({
                    where: {
                        email_in: respondentEmails
                    }
                })

                // here I'm going to make a choice of whether to create the user account
                // or connect it to existing one, cross checking if the user is actually registered already
                const respondentsArray = data.map(function (a) {
                    const isUserRegistered = _.find(users, function (b) { return b.email == a.email })

                    if (isUserRegistered) {
                        return {
                            user: {
                                connect: { email: a.email }
                            },
                            role: a.role
                        }
                    } else {
                        // create new account for this email that doesn't have any in the db
                        return {
                            user: {
                                create: { email: a.email },
                            },
                            role: a.role
                        }
                    }
                })

                const addRespondents = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        updateDummy: Math.random(),
                        respondents: { create: respondentsArray }
                    }
                }).$fragment(fragment)

                mail.sendEmail(where.slug, show.name, respondentEmails)

                return addRespondents
            } else {
                throw new Error("UserNoPrivilegeError")
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // deleting multiple respondents
    deleteRespondents: async function (parent, { auth, where }, context, info) {
        try {
            const fragment = `
            fragment DeleteRespondentsOnShow on Show {
                id
                slug
                name
                interval
                areResponsesHidden
                startTime
                endTime
                dates
                isPrivate
                isReadOnly
                respondents {
                    id
                    anonymousName
                    user {
                        id
                        uid
                        email
                        name
                        isPremium
                        createdAt
                    }
                    role
                    response
                    isKeyRespondent
                    createdAt
                    updatedAt
                }
                createdAt
                updatedAt
            }
            `

            const adminExists = await prisma.$exists.show({ slug: where.slug, respondents_some: { role: "admin" } })

            const deletedIdObject = {
                where: { slug: where.slug },
                data: {
                    updateDummy: Math.random(),
                    respondents: { delete: where.id.map(function (a) { return { id: a } }) }
                }
            }

            if (adminExists) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)

                const userIsAdmin = await prisma.$exists.show({
                    slug: where.slug,
                    respondents_some: {
                        user: { email: user.email },
                        role: "admin"
                    }
                })

                if (!userIsAdmin) {
                    throw new Error("UserNoPrivilegeError")
                }

                const deleteRespondentsWithAdmin = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                return deleteRespondentsWithAdmin
            } else {
                const deleteRespondentsNoAdmin = await prisma.updateShow(deletedIdObject).$fragment(fragment)
                return deleteRespondentsNoAdmin
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // creating a new response
    createNewResponse: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment CreateNewResponseOnShow on Show {
                id
                slug
                isPrivate
                isReadOnly
                respondents {
                    id
                    user {
                        email
                    }
                    role
                }
            }
            `
            // using $exists here will increase db query count by 3 or more
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                throw new Error("UserNotAuthorizedError")
            }

            if (auth) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                // find if user exists in the respondents list, if not then reject request
                if (show.isPrivate && !userData) {
                    throw new Error("UserNotAuthorizedError")
                }

                const createNewResponseWithUser = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        updateDummy: Math.random(),
                        respondents: {
                            create: {
                                response: { set: data.response },
                                user: {
                                    connect: { email: user.email }
                                },
                                isKeyRespondent: false
                            }
                        }
                    }
                }).$fragment(fragment)

                return createNewResponseWithUser
            } else {
                if (show.isPrivate) {
                    throw new Error("UserNotAuthorizedError")
                }

                const createNewResponseNotPrivate = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        updateDummy: Math.random(),
                        respondents: {
                            create: {
                                response: { set: data.response },
                                anonymousName: data.name,
                                user: null
                            }
                        }
                    }
                }).$fragment(fragment)

                return createNewResponseNotPrivate
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // edit response
    editResponse: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment EditResponseOnShow on Show {
                id
                slug
                isPrivate
                isReadOnly
                respondents {
                    id
                    user {
                        email
                    }
                    role
                }
            }
            `
            // didn't use $exists because db query will shot up by quite a lot
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                throw new Error("UserNotAuthorizedError")
            }

            // get the response that the user is trying to edit
            const respondentData = _.find(show.respondents, function (b) { return b.id == where.id })

            // check if show is created anonymously, if not then it's FREE FOR ALL!
            if (auth) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                // need to find response for those signed in already
                const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                if (userData.role == "admin" ||
                    user.email == (respondentData.user ? respondentData.user.email : false) ||
                    respondentData.user == null) {

                    const editResponseWithUser = await prisma.updateShow({
                        where: { slug: where.slug },
                        data: {
                            updateDummy: Math.random(),
                            respondents: {
                                update: {
                                    where: { id: where.id },
                                    data: {
                                        updateDummy: Math.random(),
                                        response: { set: data.response }
                                    }
                                }
                            }
                        }
                    }).$fragment(fragment)

                    return editResponseWithUser
                } else {
                    throw new Error("UserNoPrivilegeError")
                }
            } else {
                if (show.isPrivate || respondentData.user != null) {
                    throw new Error("UserNotAuthorizedError")
                }

                const editResponseWithoutUser = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        updateDummy: Math.random(),
                        respondents: {
                            update: {
                                where: { id: where.id, },
                                data: {
                                    updateDummy: Math.random(),
                                    response: { set: data.response }
                                }
                            }
                        }
                    }
                }).$fragment(fragment)

                return editResponseWithoutUser
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // deleting a user's response
    deleteResponse: async function (parent, { auth, where }, context, info) {
        try {
            const fragment = `
            fragment DeleteResponseOnShow on Show {
                id
                slug
                name
                interval
                areResponsesHidden
                startTime
                endTime
                dates
                isPrivate
                isReadOnly
                respondents {
                    id
                    anonymousName
                    user {
                        id
                        uid
                        email
                        name
                        isPremium
                        createdAt
                    }
                    role
                    response
                    isKeyRespondent
                    createdAt
                    updatedAt
                }
                createdAt
                updatedAt
            }
            `
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                throw new Error("UserNotAuthorizedError")
            }

            const respondentData = _.find(show.respondents, function (b) { return b.id == where.id })

            const deletedIdObject = {
                where: { slug: where.slug },
                data: {
                    updateDummy: Math.random(),
                    respondents: {
                        update: {
                            where: { id: respondentData.id },
                            data: {
                                updateDummy: Math.random(),
                                response: { set: [] }
                            }
                        }
                    }
                }
            }

            if (auth) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)

                const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                if (userData.role == "admin" ||
                    user.email == (respondentData.user ? respondentData.user.email : false) ||
                    respondentData.user == null) {

                    const deleteResponseWhenNotCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                    return deleteResponseWhenNotCreatedAnonymously
                } else {
                    throw new Error("UserNoPrivilegeError")
                }

            } else {
                if (show.isPrivate || respondentData.user != null) {
                    throw new Error("UserNotAuthorizedError")
                }

                const deleteResponseWhenCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                return deleteResponseWhenCreatedAnonymously
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // create or update response
    _upsertResponse: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment _UpsertResponseOnShow on Show {
                id
                slug
                name
                interval
                areResponsesHidden
                startTime
                endTime
                dates
                isPrivate
                isReadOnly
                respondents {
                    id
                    anonymousName
                    user {
                        id
                        uid
                        email
                        name
                        isPremium
                        createdAt
                    }
                    role
                    response
                    isKeyRespondent
                    createdAt
                    updatedAt
                }
                createdAt
                updatedAt
            }
            `
            // didn't use $exists because db query will shot up by quite a lot
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                throw new Error("UserNotAuthorizedError")
            }

            if (!where.name && !where.email) {
                throw new Error("BadRequestError")
            }

            const respondentData = _.find(show.respondents, function (b) {
                return (b.anonymousName ? b.anonymousName : false) == where.name ||
                    (b.user ? b.user.email : false) == where.email
            })
            // create new one if both doesnt exist
            if (!respondentData) {
                if (auth) {
                    const user = await authenticate.verifyUser(auth.token, auth.uid)
                    const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                    // find if user exists in the respondents list, if not then reject request
                    if (show.isPrivate && !userData) {
                        throw new Error("UserNotAuthorizedError")
                    }

                    const createNewResponseWithUser = await prisma.updateShow({
                        where: { slug: where.slug },
                        data: {
                            updateDummy: Math.random(),
                            respondents: {
                                create: {
                                    response: { set: data.response },
                                    user: {
                                        connect: { email: user.email }
                                    },
                                    isKeyRespondent: false
                                }
                            }
                        }
                    }).$fragment(fragment)

                    return createNewResponseWithUser
                } else {
                    if (show.isPrivate) {
                        throw new Error("UserNotAuthorizedError")
                    }

                    const createNewResponseNotPrivate = await prisma.updateShow({
                        where: { slug: where.slug },
                        data: {
                            updateDummy: Math.random(),
                            respondents: {
                                create: {
                                    response: { set: data.response },
                                    anonymousName: where.name,
                                    user: null,
                                    isKeyRespondent: false,
                                }
                            }
                        }
                    }).$fragment(fragment)

                    return createNewResponseNotPrivate
                }
            } else {
                if (auth) {
                    const user = await authenticate.verifyUser(auth.token, auth.uid)
                    // need to find response for those signed in already
                    const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                    if (userData.role == "admin" ||
                        user.email == (respondentData.user ? respondentData.user.email : false) ||
                        respondentData.user == null) {

                        const editResponseWithUser = await prisma.updateShow({
                            where: { slug: where.slug },
                            data: {
                                updateDummy: Math.random(),
                                respondents: {
                                    update: {
                                        where: { id: respondentData.id },
                                        data: {
                                            updateDummy: Math.random(),
                                            response: { set: data.response }
                                        }
                                    }
                                }
                            }
                        }).$fragment(fragment)

                        return editResponseWithUser
                    } else {
                        throw new Error("UserNoPrivilegeError")
                    }

                } else {
                    if (show.isPrivate || respondentData.user != null) {
                        throw new Error("UserNotAuthorizedError")
                    }

                    const editResponseWithoutUser = await prisma.updateShow({
                        where: { slug: where.slug },
                        data: {
                            updateDummy: Math.random(),
                            respondents: {
                                update: {
                                    where: { id: respondentData.id, },
                                    data: {
                                        updateDummy: Math.random(),
                                        response: { set: data.response }
                                    }
                                }
                            }
                        }
                    }).$fragment(fragment)

                    return editResponseWithoutUser
                }
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },

    // deleting a user's response through name or email
    _deleteResponse: async function (parent, { auth, where }, context, info) {
        try {
            const fragment = `
            fragment _DeleteResponseOnShow on Show {
                id
                slug
                name
                interval
                areResponsesHidden
                startTime
                endTime
                dates
                isPrivate
                isReadOnly
                respondents {
                    id
                    anonymousName
                    user {
                        id
                        uid
                        email
                        name
                        isPremium
                        createdAt
                    }
                    role
                    response
                    isKeyRespondent
                    createdAt
                    updatedAt
                }
                createdAt
                updatedAt
            }
            `
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                throw new Error("UserNotAuthorizedError")
            }

            const respondentData = _.find(show.respondents, function (b) {
                return (b.anonymousName ? b.anonymousName : false) == where.name ||
                    (b.user ? b.user.email : false) == where.email
            })

            deletedIdObject = {
                where: { slug: where.slug },
                data: {
                    updateDummy: Math.random(),
                    respondents: {
                        update: {
                            where: { id: respondentData.id },
                            data: {
                                updateDummy: Math.random(),
                                response: { set: [] }
                            }
                        }
                    }
                }
            }

            if (auth) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)

                const userData = _.find(show.respondents, function (a) { return (a.user ? a.user.email : false) == user.email })

                if (userData.role == "admin" ||
                    user.email == (respondentData.user ? respondentData.user.email : false) ||
                    respondentData.user == null) {

                    const deleteResponseWhenNotCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                    return deleteResponseWhenNotCreatedAnonymously
                } else {
                    throw new Error("UserNoPrivilegeError")
                }

            } else {
                if (show.isPrivate || respondentData.user != null) {
                    throw new Error("UserNotAuthorizedError")
                }

                const _deleteResponseWhenCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                return _deleteResponseWhenCreatedAnonymously
            }
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    },
}

module.exports = {
    Mutation,
}