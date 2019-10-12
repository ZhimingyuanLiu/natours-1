const nodemailer = require('nodemailer')

const sendEmail = async options => {
	//* 1) Create a transporter
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD
		}
	})

	//* 2) Definde the mail options
	const mailOptions = {
		from: 'Lasse DerEchte <lasse@unternehmer.io',
		to: options.email,
		subject: options.subject,
		text: options.message
		//html: options.html
	}

	//* 3) Send the email with nodemailer
	await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
