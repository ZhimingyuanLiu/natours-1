const User = require('./../models/userModel')
const AppError = require('./../utils/AppError')
const catchAsync = require('./../utils/catchAsync')

const filterObj = (obj, ...alllowedFields) => {
	const newObj = {}

	// Loop throw an object
	Object.keys(obj).forEach(el => {
		if (alllowedFields.includes(el)) newObj[el] = obj[el]
	})

	return newObj
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
	//* EXECUTE QUERY */
	const users = await User.find()

	//* SEND RESPONSE */
	res.status(200).json({
		status: 'Success',
		result: users.length,
		data: {
			users
		}
	})
})

exports.getUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not yet defined!'
	})
}

exports.createUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not yet defined!'
	})
}

exports.updateUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not yet defined!'
	})
}

exports.deleteUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not yet defined!'
	})
}

exports.updateMe = catchAsync(async (req, res, next) => {
	//* 1) Create error if user POSTs password data
	if (req.body.passwordCurrent || req.body.password || req.body.passwordConfirm) {
		return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
	}

	//* 2) Filter out unwanted field names that aren't allowed to be updated
	const filteredBody = filterObj(req.body, 'name', 'email')

	//* 3) Update user document
	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })

	res.status(200).json({
		status: 'success',
		data: {
			user: updatedUser
		}
	})
})
