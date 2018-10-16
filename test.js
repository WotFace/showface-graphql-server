const { prisma } = require('./generated/prisma');
var _ = require('lodash');
const mail = require('./src/utils/nodemailer')
var fs = require('fs')
const randomWords = require('./src/utils/random-words')

for (i = 0; i < 10; i++) {
    
    const slugWordsNo = Math.floor(Math.random() * 1.999 + 3)
    console.log(randomWords({ exactly: slugWordsNo, join: '-' }))
}

// var wordArray = []

// fs.readFile('./words.txt', 'utf8', function(err, data) {
//     if (err) {
//         console.log(err)
//     }

//     const splitArray = data.split("\n")
//     for (i = 0; i < splitArray.length; i++) {
//         if (!/[!@#$%^&*'-/(),.?":{}|<>]/.test(splitArray[i])) {
//             if (i % 200 == 0) {
//                 wordArray.push('"' + splitArray[i] + '"\n')
//             } else {
//                 wordArray.push('"' + splitArray[i] + '"')
//             }
//         }
//     }

//     fs.writeFile('./words-clean.txt', wordArray, function(err) {
//         console.log(err)
//         console.log('file saved')
//     })
//     console.log('number of words: ' + wordArray.length);
// })



async function getAllUsers() {
    const allUsers = await prisma.users()
    throw new Error("hello this is an error")
}

async function getShow(slug) {

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

    const show = await prisma.show({ slug: slug }).$fragment(fragment)
    return show
}

async function getShows(email) {
    const shows = await prisma.shows({
        where: {
            respondents_every: {
                user: {
                    email: email
                }
            }
        }
    })
    return shows
}

async function getShowRespondents() {

}

async function editUserSetings(email, data) {
    update = await prisma.updateUser({
        where: { email: email },
        data: data
    })

    console.log(update)

    return update
}

async function updateShow() {
    const user = {
        email: "anthony_tantra@u.nus.edu"
    }

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
    const showRespondents = await prisma.show({ slug: "menon-green" }).$fragment(fragment)

    userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })

    if (userData.role != 'admin') {
        return
    }

    const editShowSettings = await prisma.updateShow({
        where: {
            slug: "menon-green"
        },
        data: {
            isAnonymous: false
        }
    })

    return {
        editShowSettings
    }
}

async function deleteShow() {
    const user = {
        email: "anthony_tantra@u.nus.edu"
    }

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
    const showRespondents = await prisma.show({ slug: "menon-red" }).$fragment(fragment)

    console.log('show resp: ' + showRespondents.respondents[0].user.email)

    userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })
    console.log('user found ' + userData.role)

    if (userData.role != 'admin') {
        return
    }

    const deleteShow = await prisma.deleteShow({
        slug: "menon-red"
    })

    return {
        deleteShow
    }
}

async function addRespondents() {
    const user = {
        email: "anthony_tantra@u.nus.edu"
    }

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
    const showRespondents = await prisma.show({ slug: "menon-green" }).$fragment(fragment)

    userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })

    if (userData.role != 'admin') {
        return
    }

    arr = [
        { respondentEmail: "tantra.anthony@gmail.com", respondentRole: "member" },
        { respondentEmail: "green_apple-juice@hotmail.com", respondentRole: "member" },
    ]


    respondentsArray = arr.map(function (a) {
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
        where: { slug: "menon-green" },
        data: {
            respondents: {
                create: respondentsArray
            }
        }
    })

    console.log(addRespondents)

    return {
        addRespondents
    }
}

async function deleteRespondents() {
    const user = {
        email: "anthony_tantra@u.nus.edu"
    }

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
    const showRespondents = await prisma.show({ slug: "menon-green" }).$fragment(fragment)

    userData = _.find(showRespondents.respondents, function (a) { return a.user.email == user.email })

    if (userData.role != 'admin') {
        return
    }

    arr = ['tantra.anthony@gmail.com', 'green_apple-juice@hotmail.com']

    const respondentsUidArray = arr.map(function (email) {
        const matchingUser = _.find(showRespondents.respondents, function (a) { return a.user.email == email })
        return { 
            id: matchingUser.id
        }
    })
    console.log(respondentsUidArray)

    const addRespondents = await prisma.updateShow({
        where: { slug: "menon-green" },
        data: {
            respondents: {
                delete: respondentsUidArray
            }
        }
    })

    console.log(addRespondents)

    return {
        addRespondents
    }
}

async function shows() {
    await createUser
    console.log(createUser)
}

function join() {
    hello = [{
        numberOne: '1',
        numberTwo: {
            email: 'hello'
        }
    }]

    hello2 = {
        numberThree: '3'
    }

    butt = _.find(hello, function (a) { return a.numberTwo.email == 'hello' })

    console.log(_.find(hello, function (a) { return a.numberTwo.email == 'hello' }))
    console.log('hello')
    console.log(butt == null)
}

async function helloIamGroot() {
    const butt = await prisma.$exists.show({
        slug: "express-land-pocket",
        respondents_every: {
            role: "admin"
        }
    })
    console.log(butt)
    return butt
}
// getAllUsers(function(users) {
//     console.log(users)
// }).catch(function(err) {5
//     console.error(err)
// })