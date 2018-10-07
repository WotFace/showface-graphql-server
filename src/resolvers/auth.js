// const admin = require('../firebase/firebase-admin')
const { prisma } = require('../../generated/prisma')

// auth methods go here!
exports.verifyUser = async function(token, uid) {
    // const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await prisma.user({ uid: decodedToken.uid })

    return user
    // if(user && decodedToken.uid == uid) {
    //     return user; // don't forget to catch the function
    // } else {
    //     throw new Error("Verification failed!")
    // }
}