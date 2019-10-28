const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('./../../models/tourModel')
const User = require('./../../models/userModel')
const Review = require('./../../models/reviewModel')

dotenv.config({ path: './config.env' })

const pwd = process.env.DATABASE_PASSWORD
const db = process.env.DATABASE
const DB = db.replace('<PASSWORD>', pwd)

// READ JSON FILE
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))

// IMPORT DATA INTO DB
const importData = async () => {
	try {
		await User.create(users, { validateBeforeSave: false })
		await Tour.create(tours)
		await Review.create(reviews)
		console.log('Data successfully loaded!')
	} catch (err) {
		console.log(err)
	}
}

// DELETE ALL DATA FROM DB-COLLECTION
const deleteData = async () => {
	try {
		await User.deleteMany()
		await Tour.deleteMany()
		await Review.deleteMany()
		console.log('Data successfully deleted!')
	} catch (err) {
		console.log(err)
	}
}

const resetData = async () => {
	try {
		await deleteData()
		await importData()
	} catch (err) {
		console.log(err)
	}
}

;(async () => {
	try {
		await mongoose
			.connect(DB, {
				useNewUrlParser: true,
				useCreateIndex: true,
				useUnifiedTopology: true,
				useFindAndModify: false
			})
			.then(() => {
				console.log('DB connection sucessful!')
			})

		if (process.argv[2] === '--import') {
			await importData()
		} else if (process.argv[2] === '--delete') {
			await deleteData()
		} else if (process.argv[2] === '--reset') {
			await resetData()
		} else {
			console.log(`Please specify '--import' or '--delete' or '--reset'`)
		}
		await mongoose.disconnect()
		process.exit()
	} catch (err) {
		console.log(err)
	}
})()
