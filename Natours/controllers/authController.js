const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const AppError = require('./../utils/AppError')
const catchAsync = require('./../utils/catchAsync')
const Email = require('./../utils/email')

const signToken = id => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN
	})
}

const createSendToken = (user, showUserData, res, statusCode, req) => {
	const token = signToken(user._id)

	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // convert to milliseconds (was days before)
		httpOnly: true // Cannot be accessed or modified
	}

	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true // Will only be send on encrypted connection (https)

	res.cookie('jwt', token, cookieOptions)

	if (showUserData) {
		res.status(statusCode).json({
			status: 'success',
			token,
			data: {
				user: {
					name: user.name,
					email: user.email,
					password: req.body.password
				}
			}
		})
	} else {
		res.status(statusCode).json({
			status: 'success',
			token
		})
	}
}

exports.signup = catchAsync(async (req, res, next) => {
	//* 1) Create new user
	// Create the user only with valid data, can't set the role property hisself
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm
	})

	//* 2) Send the welcome email to the new user
	const url = `${req.protocol}://${req.get('host')}/me`
	await new Email(newUser, url).sendWelcome()

	//* 3) Send him his token
	createSendToken(newUser, true, res, 201, req)
})

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body

	//* 1) Check if email and password exist
	if (!email || !password) {
		return next(new AppError('Please provide email and password!', 400))
	}

	//* 2) Check if the user exists && password is correct
	// The passwort is by default excluded, not to leak any data (that's why we explicitly have to select it)
	const user = await User.findOne({ email: email }).select('+password')

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password', 400))
	}

	//* 3) If everything is ok, send token to client
	createSendToken(user, false, res, 200)
})

exports.protect = catchAsync(async (req, res, next) => {
	//* 1) Getting token and check if it's there
	let token
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1]
	} else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
		token = req.cookies.jwt
	}

	if (!token) {
		return next(new AppError('You are not logged in! Please log in to get access.', 401))
	}

	//* 2) Verify token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

	//* 3) Check if user still exists
	const currentUser = await User.findById(decoded.id)
	if (!currentUser) return next(new AppError('The user belonging to this token does no longer exit', 401))

	//* 4) Check if user changed password after the token was issued
	if (currentUser.changedPasswortAfter(decoded.iat)) {
		return next(new AppError('User recently changed his password! Please log in again.', 401))
	}

	//* 5) Grant access to protected route
	req.user = currentUser
	res.locals.user = currentUser
	next()
})

// Only for rendered oages, no errors!
exports.isLoggedIn = async (req, res, next) => {
	if (req.cookies.jwt) {
		try {
			//* 1) Verify token
			const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

			//* 2) Check if user still exists
			const currentUser = await User.findById(decoded.id)
			if (!currentUser) return next()

			//* 3) Check if user changed password after the token was issued
			if (currentUser.changedPasswortAfter(decoded.iat)) {
				return next()
			}

			//* There is a logged in user
			res.locals.user = currentUser
			return next()
		} catch (err) {
			return next()
		}
	}
	next()
}

exports.logout = (req, res) => {
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true
	})
	res.status(200).json({ status: 'success' })
}

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		//? that's what roles will (can) look like -> roles ['admin', 'lead-guide']

		if (!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform that action', 403))
		}

		next()
	}
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
	//* 1) Get user based on POSTed email
	const user = await User.findOne({ email: req.body.email })
	if (!user) return next(new AppError('There is no user with that email address.', 404))

	//* 2) Generate the random reset token
	const resetToken = user.createPasswordResetToken()
	await user.save({ validateBeforeSave: false })

	//* 3) Send the token to the user's email
	try {
		const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

		await new Email(user, resetURL).sendPasswordReset()

		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!'
		})
	} catch (err) {
		// Remove needed properties
		delete user.passwordResetToken
		delete user.passwordResetExpires

		await user.save({ validateBeforeSave: false })

		return next(new AppError('There was an error sending the email. Try again later!', 500))
	}
})

exports.resetPassword = catchAsync(async (req, res, next) => {
	//* 1) Get user based on the token
	// Create hashedToken, which is stored in db
	const hashedToken = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex')

	// Look for the user in the db
	const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

	//* 2) If token has not expired, and there is a user, set the new password
	// Error handling
	if (!user) return next(new AppError('Token is invalid or has expired!', 400))

	// Set new password
	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm

	// Remove needed properties
	user.passwordResetToken = undefined
	user.passwordResetExpires = undefined

	// Save document
	await user.save()

	//* 3) Log the user in, send JWT
	createSendToken(user, false, res, 200)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
	//* 1) Get user from collection
	const user = await User.findById(req.user._id).select('+password')

	//* 2) Check if POSTed current password is correct
	if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
		return next(new AppError('Your current password is wrong.', 401))
	}

	//* 3) If so, update passsword
	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm
	// User.findByIdAndUpdate won't work as intended!
	await user.save()

	//* 4) Log user in, send JWT
	createSendToken(user, false, res, 200)
})
