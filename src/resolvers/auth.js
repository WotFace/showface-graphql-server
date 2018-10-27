const admin = require('../firebase/firebase-admin')
const { prisma } = require('../../generated/prisma')

exports.verifyUser = async function (token, uid) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token)
        
        if (decodedToken.uid != uid) {
            throw new Error("AuthenticationError")
        }
    
        const user = await prisma.user({ email: decodedToken.email })
    
        return user
    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}

exports.verifyUserForSignUp = async function (token, uid) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token)
    
        if (decodedToken.uid != uid) {
            throw new Error("AuthenticationError")
        }

        return decodedToken
    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}