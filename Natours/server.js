const mongoose = require('mongoose')
const dotenv = require('dotenv')

process.on('uncaughtException', err => {
	console.log('UNHANDLED EXCEPTION! 🔥 Shutting down...')
	console.log(err.name, err.message)

	process.exit(1)
})

dotenv.config({ path: './config.env' })

const app = require('./app')

const pwd = process.env.DATABASE_PASSWORD
const db = process.env.DATABASE
const DB = db.replace('<PASSWORD>', pwd)

mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log('DB connection sucessful!')
	})

const port = process.env.PORT || 3000
const server = app.listen(port, () => {
	console.log(`App running on port ${port}.`)
})

process.on('unhandledRejection', err => {
	console.log('UNHANDLED REJECTION! 🔥 Shutting down...')
	console.log(err.name, err.message)

	server.close(() => {
		process.exit(1)
	})
})
