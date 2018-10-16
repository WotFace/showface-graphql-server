// library
const nodemailer = require('nodemailer')

const mail = {}

// config
const config = require('../config')

const transporter = nodemailer.createTransport(config.mailTransporter)

mail.sendEmail = async function (slug, title, respondents) {
    const mailOptions = {
        from: '"ShowFace Administrator" <admin@showface.io>',
        to: respondents,
        subject: 'You are invited to join ' + title,
        html: 'You are invited to the show ' + title + '. Click on the link below to indicate your interest:\n\nhttps://showface.io/show/' + slug
    }
    transporter.sendMail(mailOptions, function(error, info) {
        if(error) {
            console.log(error)
        }
    })
}

module.exports = mail