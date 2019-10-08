const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('./../../models/tourModel')

dotenv.config({ path: './config.env' })

const pwd = process.env.DATABASE_PASSWORD
const db = process.env.DATABASE
const DB = db.replace('<PASSWORD>', pwd)

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'))

// IMPORT DATA INTO DB
const importData = async () => {
	try {
		await Tour.create(tours)
		console.log('Data successfully loaded!')
	} catch (err) {
		console.log(err)
	}
}

// DELETE ALL DATA FROM DB-COLLECTION
const deleteData = async () => {
	try {
		await Tour.deleteMany()
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
			console.log(`Please specify '--import' or '--delete'`)
		}
		await mongoose.disconnect()
		process.exit()
	} catch (err) {
		console.log(err)
	}
})()
