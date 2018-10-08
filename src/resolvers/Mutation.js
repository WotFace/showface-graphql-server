const authenticate = require('./auth')
const { prisma } = require('../../generated/prisma')
const _ = require('lodash')
const utils = require('../utils')

// before production turn all prisma. to context.db. for explicitness
const Mutation = {

    // creating a new user
    createUser: async function (parent, { auth, data }, context, info) {
        try {
            // const user = await authenticate.verifyUser(auth.token, auth.uid)
            const createUser = await prisma.createUser(data)
            return createUser
        } catch (err) {
            console.log(err)
            return
        }
    },

    // editing a user's settings
    editUserSettings: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const updateUser = await prisma.updateUser({
                where: { email: user.email },
                data: data
            })

            console.log(updateUser)
            // we don't need to catch a few errors here because our
            // schema catches them and the data field would be null
            return {
                updateUser
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // creating some new show
    createNewShow: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const randomUniqueSlug = "insert slug generation method here"

            const data = _.merge(data, {
                slug: randomUniqueSlug,
                respondents: {
                    create: {
                        user: {
                            connect: {
                                email: user.email
                            }
                        },
                        role: "admin"
                    }
                }
            })

            const createNewShow = await prisma.createShow(data)

            return {
                createNewShow
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // editing some show's settings
    editShowSettings: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment RespondentsOnShow on Show {
                respondents {
                    user {
                        email
                    }
                    role
                }
            }
            `
            // check if current requesting user is admin of current show
            const showRespondents = await prisma.show({ slug: data.slug }).$fragment(fragment)

            const userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })

            if (userData.role != 'admin') {
                return
            }

            const editShowSettings = await prisma.updateShow({
                where: {
                    slug: data.slug
                },
                data: data
            })

            return {
                editShowSettings
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // deleting a show
    deleteShow: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment RespondentsOnShow on Show {
                respondents {
                    user {
                        email
                    }
                    role
                }
            }
            `
            // check if current requesting user is admin of current show
            const showRespondents = await prisma.show({ slug: data.slug }).$fragment(fragment)

            const userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })

            if (userData.role != 'admin') {
                return
            }

            const deleteShow = await prisma.deleteShow({
                slug: data.slug
            })

            return {
                deleteShow
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // editing existing respondents' status (e.g. changing to admin)
    editShowRespondentStatus: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment RespondentsOnShow on Show {
                respondents {
                    id
                    user {
                        email
                    }
                    role
                }
            }
            `
            const showResult = await prisma.show({ slug: data.slug }).$fragment(fragment)

            const userData = _.find(showResult.respondents, function (a) { return a.user.email == user.email })

            // if user is admin 
            if (userData.role != "admin") {
                return
            }

            const updateUserData = _.find(showResult.respondents, function (a) { return a.user.email == data.email })

            updateUserStatus = await prisma.updateShow({
                where: { slug: data.slug },
                data: {
                    respondents: {
                        update: {
                            where: { id: updateUserData.id },
                            data: {
                                role: data.role
                            }
                        }
                    }
                }
            })

            return {
                updateUserStatus
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // adding respondents
    addRespondents: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment RespondentsOnShow on Show {
                respondents {
                    user {
                        email
                    }
                    role
                }
            }
            `
            // check if current requesting user is admin of current show
            const showRespondents = await prisma.show({ slug: data.slug }).$fragment(fragment)

            const userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })

            if (userData.role != 'admin') {
                return
            }

            // here lies a complex problem... : if they are invited but are not signed up yet
            // do we approve? or do we not? because if we want to get the user email
            // we need to do this connect/
            const respondentsArray = data.respondentDetails.map(function (a) {
                return {
                    user: {
                        connect: {
                            email: a.respondentEmail
                        }
                    },
                    role: a.respondentRole
                }
            })

            const addRespondents = await prisma.updateShow({
                where: { slug: data.slug },
                data: {
                    respondents: {
                        create: respondentsArray
                    }
                }
            })

            return {
                addRespondents
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // deleting multiple respondents
    deleteRespondents: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment RespondentsOnShow on Show {
                respondents {
                    id
                    user {
                        email
                    }
                    role
                }
            }
            `
            // check if current requesting user is admin of current show
            const showRespondents = await prisma.show({ slug: data.slug }).$fragment(fragment)

            const userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })

            if (userData.role != 'admin') {
                return
            }

            const respondentsUidArray = data.respondentEmails.map(function (email) {
                const matchingUsers = _.find(showRespondents.respondents, function (a) { return a.user.email == email })
                return {
                    id: matchingUsers.id
                }
            })

            const deleteRespondents = await prisma.updateShow({
                where: { slug: data.slug },
                data: {
                    respondents: {
                        delete: respondentsUidArray
                    }
                }
            })

            return {
                deleteRespondents
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // creating or editing a user's response
    createOrEditResponse: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment RespondentsOnShow on Show {
                isPrivate
                respondents {
                    id
                    user {
                        email
                    }
                    role
                }
            }
            `
            const showResult = await prisma.show({ slug: data.slug }).$fragment(fragment)

            const userData = _.find(showResult.respondents, function (a) { return a.user.email == user.email })

            // when user is not a part of the list but the show's private
            if (showResult.isPrivate && userData == null) {
                return
            }

            if (userData != null) {
                const createOrEditResponse = await prisma.updateShow({
                    where: { slug: data.slug },
                    data: editResponseWhenUserExists(userData.id, data.response)
                })

                return {
                    createOrEditResponse
                }
            } else {
                const createOrEditResponse = await prisma.updateShow({
                    where: { slug: data.slug },
                    data: createResponseWhenUserNotExist(user.email, data.response)
                })

                return {
                    createOrEditResponse
                }
            }

            return {
                createOrEditResponse
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // deleting a user's response
    deleteResponse: async function (parent, { auth, data }, context, info) {
        try {
            const user = await authenticate.verifyUser(auth.token, auth.uid)

            const fragment = `
            fragment RespondentsOnShow on Show {
                respondents {
                    id
                    user {
                        email
                    }
                    role
                }
            }
            `
            const showResult = await prisma.show({ slug: data.slug }).$fragment(fragment)

            const userData = _.find(showResult.respondents, function (a) { return a.user.email == user.email })

            // if user is admin or the deleted response is his own
            // when user is not a part of the list but the show's private
            if (userData.role != "admin" || data.email != userData.user.email) {
                return
            }

            const deleteResponseData = _.find(showResult.respondents, function (a) { return a.user.email == data.email })

            deleteResponse = await prisma.updateShow({
                where: { slug: data.slug },
                data: {
                    respondents: {
                        delete: {
                            id: deleteResponseData ? deleteResponseData : null
                        }
                    }
                }
            })

            return {
                deleteResponse
            }
        } catch (err) {
            console.log(err)
            return
        }
    },
}

function createResponseWhenUserNotExist(email, response) {
    return {
        respondents: {
            create: {
                role: "member",
                response: {
                    set: response,
                },
                user: {
                    connect: {
                        email: email
                    }
                }
            }
        }
    }
}

function editResponseWhenUserExists(id, response) {
    return {
        respondents: {
            update: {
                where: { id: id },
                data: {
                    response: response,
                }
            }
        }
    }
}

module.exports = {
    Mutation,
}