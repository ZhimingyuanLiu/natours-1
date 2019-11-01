const multer = require('multer')
const sharp = require('sharp')
const User = require('./../models/userModel')
const AppError = require('./../utils/AppError')
const catchAsync = require('./../utils/catchAsync')
const factory = require('./handlerFactory')

//* MULTER */
const multerStorage = multer.memoryStorage()
const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true)
	} else {
		cb(new AppError('Not an image! Please upload only images.', 400), false)
	}
}
const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = (req, res, next) => {
	// uploadUserPhoto puts the file on req.file
	if (!req.file) return next()

	req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

	//* Convert image */
	sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.file.filename}`)

	next()
}

//? Returns a new object which only contains "...allowedFields" properties
const filterObj = (obj, ...alllowedFields) => {
	const newObj = {}

	// Loops throw an object
	Object.keys(obj).forEach(el => {
		if (alllowedFields.includes(el)) newObj[el] = obj[el]
	})

	return newObj
}

exports.createUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not defined! Please use /signup instead.'
	})
}

exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
exports.updateUser = factory.updateOne(User) // Do NOT update passwords with this
exports.deleteUser = factory.deleteOne(User)

exports.getMe = (req, res, next) => {
	req.params.id = req.user.id
	next()
}

exports.updateMe = catchAsync(async (req, res, next) => {
	//* 1) Create error if user POSTs password data
	if (req.body.passwordCurrent || req.body.password || req.body.passwordConfirm) {
		return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
	}

	//* 2) Filter out unwanted field names that aren't allowed to be updated
	const filteredBody = filterObj(req.body, 'name', 'email')
	if (req.file) filteredBody.photo = req.file.filename

	//* 3) Update user document
	const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, { new: true, runValidators: true })

	res.status(200).json({
		status: 'success',
		data: {
			user: updatedUser
		}
	})
})

exports.deleteMe = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user._id, { active: false })

	res.status(204).json({
		status: 'success',
		data: null
	})
})
