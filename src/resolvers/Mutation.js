// db replace with context in production
const { prisma } = require('../../generated/prisma')

// extensible auth middleware
const authenticate = require('./auth')

// libraries
const _ = require('lodash')
const randomWords = require('random-words')

// utils
const utils = require('../utils')

// before production turn all prisma. to context.db. for explicitness
const Mutation = {

    // creating a new user
    createUser: async function (parent, { auth, data }, context, info) {
        try {
            // authenticate firebase user first see if they're alive, might need to change the middleware though
            // const user = await authenticate.verifyUser(auth.token, auth.uid)
            const userData = _.merge(data, { uid: auth.uid })

            const createUser = await prisma.upsertUser({
                where: { email: data.email },
                create: userData,
                update: userData
            })

            return createUser
        } catch (err) {
            console.log(err)
            return
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
            return
        }
    },

    // creating some new show
    createNewShow: async function (parent, { auth, data }, context, info) {
        try {
            const randomUniqueSlug = randomWords({ exactly: 3, join: '-' })

            const fragment = `
            fragment CreateNewShowOnShow on Show {
                id
                slug
                name
                isPrivate
                isAnonymous
                isCreatedAnonymously
                isReadOnly
                startDate
                endDate
                interval
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
            // if auth exists, means that the user must be verified before being
            // able to create a show
            if (auth != null) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)

                const showData = _.merge(data, {
                    slug: randomUniqueSlug,
                    isCreatedAnonymously: false,
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
                // then show will be created anonymously
                const showData = _.merge(data, {
                    slug: randomUniqueSlug,
                    isCreatedAnonymously: true,
                })

                const createNewAnonymousShow = await prisma.createShow(showData).$fragment(fragment)

                return createNewAnonymousShow
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // editing some show's settings
    editShowSettings: async function (parent, { auth, where, data }, context, info) {
        try {
            // get show data such that we know whether it is private or created anonymously
            const fragment = `
            fragment EditShowOnShow on Show {
                isCreatedAnonymously
                respondents {
                    user {
                        email
                    }
                    role
                }
            }
            `
            // check if current requesting user is admin of current show
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            // if auth exists and the show is created anonymously, then handle accordingly
            if (show.isCreatedAnonymously) {
                const showData = _.omit(data, ['isReadOnly', 'isPrivate', 'isAnonymous'])

                const editShowCreatedAnonymously = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: showData
                })

                return editShowCreatedAnonymously
            } else {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
    
                if (userData.role != 'admin') {
                    return null
                }

                const editShowNotCreatedAnonymously = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: data
                })
            
                return editShowNotCreatedAnonymously
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // deleting a show
    deleteShow: async function (parent, { auth, where }, context, info) {
        try {
            const fragment = `
            fragment DeleteShowOnShow on Show {
                isCreatedAnonymously
                respondents {
                    user {
                        email
                    }
                    role
                }
            }
            `
            // check if current requesting user is admin of current show
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)
            
            // check if user has authentication and show is not created anonymously
            if (auth != null && !show.isCreatedAnonymously) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
    
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
    
                if (userData.role != 'admin') {
                    return null
                }
    
                const deleteShow = await prisma.deleteShow({ slug: where.slug })

                console.log(deleteShow)
                return utils.resultOk("Successfully deleted show " + where.slug)
            } else {
                return utils.resultError(401, "Unauthorized")
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // editing existing respondents' status (e.g. changing to admin)
    editShowRespondentStatus: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment EditRespondentsOnShow on Show {
                isCreatedAnonymously
                respondents {
                    id
                    user {
                        email
                    }
                    role
                }
            }
            `
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)
            
            if (!show.isCreatedAnonymously) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
    
                // if user is admin 
                if (userData.role != "admin") {
                    return null
                }
    
                const updateUserData = _.find(show.respondents, function (a) { return a.id == where.id })
    
                // if the specified user is not a signed in user, then cannot be admin
                if (!updateUserData.user) {
                    return null
                }

                updateUserStatus = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        respondents: {
                            update: {
                                where: { id: updateUserData.id },
                                data: { role: data.role }
                            }
                        }
                    }
                }).$fragment(fragment)

                console.log(updateUserStatus)
                return updateUserStatus
            } else {
                // everyone's an admin so they can't change shit
                return null
            }
        } catch (err) {
            console.log(err)
            return err
        }
    },

    // adding respondents
    addRespondentsByEmail: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment AddRespondentsOnShow on Show {
                isCreatedAnonymously
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
            // check if current requesting user is admin of current show
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            // this feature is not for shows which have been created anonymously
            // first check whether show is anonymous first
            if (!show.isCreatedAnonymously) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
    
                // check if user is admin of show
                if (userData.role != 'admin') {
                    return null
                }

                // what I'm doing here is to return an array of all the emails so I can get a list of 
                // registered users
                respondentEmails = data.map(function(a) {
                    return a.email
                })

                // here I'm getting a list of registered users in the list of email
                const users = prisma.users({ 
                    where: {
                        email_in: respondentEmails
                    }
                })

                // here I'm going to make a choice of whether to create the user account
                // or connect it to existing one, cross checking if the user is actually registered already
                const respondentsArray = data.map(function (a) {
                    const isRegisteredUser = _.find(users, function(b) { return b.email == a.email })
                    
                    if (isRegisteredUser) {
                        return {
                            user: {
                                connect: { email: a.email }
                            },
                            role: a.role
                        }
                    } else {
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
                        respondents: { create: respondentsArray }
                    }
                }).$fragment(fragment)
    
                return addRespondents
            } else {
                return null
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // deleting multiple respondents
    deleteRespondents: async function (parent, { auth, where }, context, info) {
        try {
            const fragment = `
            fragment DeleteRespondentsOnShow on Show {
                isCreatedAnonymously
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
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            const deletedIdObject = {
                where: { slug: where.slug },
                data: {
                    respondents: { delete: where.id.map(function(a) { return { id: a }}) }
                }
            }

            if (!show.isCreatedAnonymously) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
    
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
    
                if (userData.role != 'admin') {
                    return null
                }

                const deleteRespondentsWhenNotCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                return deleteRespondentsWhenNotCreatedAnonymously
            } else {
                const deleteRespondentWhenCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                return deleteRespondentWhenCreatedAnonymously
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // creating a new response
    createNewResponse: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment RespondentsOnShow on Show {
                isPrivate
                isCreatedAnonymously
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
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                return null
            }
            
            // check if show is created anonymously, if it is, then heck care just create another response
            if (!show.isCreatedAnonymously && show.isPrivate) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
                // when show is not private user can still add even though they're not invited
                // so the only way we can return null is when show is private AND there is no user that matches
                // this check weeds out the users who are not signed in trying to change a private show
                if (show.isPrivate && userData == null) {
                    return null
                }
                // fuck the name damn long
                const createNewResponseNotCreatedAnonymously = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        respondents: {
                            create: {
                                response: { set: data.response },
                                user: {
                                    connect: { email: user.email }
                                }
                            }
                        }
                    }
                }).$fragment(fragment)

                return createNewResponseNotCreatedAnonymously
            } else {
                const createNewResponseCreatedAnonymously = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        respondents: {
                            create: {
                                response: { set: data.response },
                                anonymousName: data.name
                            }
                        }
                    }
                }).$fragment(fragment)

                return createNewResponseCreatedAnonymously
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // edit response
    editResponse: async function (parent, { auth, where, data }, context, info) {
        try {
            const fragment = `
            fragment RespondentsOnShow on Show {
                isPrivate
                isCreatedAnonymously
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
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                return null
            }

            // get the response that the user is trying to edit
            const respondentData = _.find(show.respondents, function (b) { return b.id == where.id })
            
            // check if show is created anonymously, if not then it's FREE FOR ALL!
            if (auth) {
                console.log('hello')
                const user = await authenticate.verifyUser(auth.token, auth.uid)
                // need to find response for those signed in already
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })

                // this checks if the user is him/herself or whether the user is an admin
                // since they can change
                if (userData.role != "admin" || user.email != respondentData.email || respondentData.user != null) {
                    return null
                }

                const editResponseNotCreatedAnonymously = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        respondents: {
                            update: {
                                where: { id: where.id },
                                data: { 
                                    response: { set: data.response  }
                                }
                            }
                        }
                    }
                }).$fragment(fragment)

                return editResponseNotCreatedAnonymously
            } else {
                if (show.isPrivate || respondentData.user != null) {
                    return null
                }

                const editResponseCreatedAnonymously = await prisma.updateShow({
                    where: { slug: where.slug },
                    data: {
                        respondents: {
                            update: {
                                where: { id: where.id, },
                                data: { 
                                    response: { set: data.response }
                                }
                            }
                        }
                    }
                }).$fragment(fragment)

                return editResponseCreatedAnonymously
            }
        } catch (err) {
            console.log(err)
            return
        }
    },

    // deleting a user's response
    deleteResponse: async function (parent, { auth, where }, context, info) {
        try {
            const fragment = `
            fragment RespondentsOnShow on Show {
                isCreatedAnonymously
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
            const show = await prisma.show({ slug: where.slug }).$fragment(fragment)

            if (show.isReadOnly) {
                return null
            }

            const respondentData = _.find(show.respondents, function (b) { return b.id == where.id })

            const deletedIdObject = {
                where: { slug: where.slug },
                data: {
                    respondents: {
                        delete: { id: where.id }
                    }
                }
            }
            
            if (auth) {
                const user = await authenticate.verifyUser(auth.token, auth.uid)
    
                const userData = _.find(show.respondents, function (a) { return a.user.email == user.email })
    
                // there are three conditions here if the show is not created anonymously
                // first is that if the user is admin, they can delete whatever,
                // second one is when the respondent id email that is going to be deleted belongs to a certain user email
                // third one is when there is no user attached to the respondent id itself, it's free for all right? lolol
                if (userData.role != "admin" || user.email != respondentData.email || respondentData.user != null) {
                    return null
                }

                const deleteResponseWhenNotCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)

                return deleteResponseWhenNotCreatedAnonymously
            } else {
                if (show.isPrivate || respondentData.user != null) {
                    return null
                }

                const deleteResponseWhenCreatedAnonymously = await prisma.updateShow(deletedIdObject).$fragment(fragment)
                
                return deleteResponseWhenCreatedAnonymously
            }
        } catch (err) {
            console.log(err)
            return
        }
    },
}

module.exports = {
    Mutation,
}