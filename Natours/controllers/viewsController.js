const Tour = require('./../models/tourModel')
const Bookings = require('./../models/bookingModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/AppError')

exports.alerts = (req, res, next) => {
	const { alert } = req.query
	if (alert === 'booking') {
		res.locals.alert =
			"Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediately, please come back later."
	}
	next()
}

exports.getOverview = catchAsync(async (req, res, next) => {
	//* 1) Get tour data from collection
	const tours = await Tour.find()

	//* 2) Render that template using tour data from 1)
	res.status(200).render('overview', {
		title: 'All Tours',
		tours
	})
})

exports.getTour = catchAsync(async (req, res, next) => {
	//* 1) Get the data, for the requested tour (including reviews and tours)
	const tour = await Tour.findOne({ slug: req.params.slug }).populate({
		path: 'reviews',
		fields: 'review rating user'
	})

	if (!tour) {
		return next(new AppError('There is no tour with that name', 404))
	}

	//* 2) Render template using data from 1)
	res.status(200).render('tour', {
		title: `${tour.name} Tour`,
		tour
	})
})

exports.getLoginForm = (req, res) => {
	res.status(200).render('login', {
		title: 'Log into your account'
	})
}

exports.getRegisterForm = (req, res) => {
	res.status(200).render('register', {
		title: 'Create your account'
	})
}

exports.getAccount = (req, res) => {
	res.status(200).render('account', {
		title: 'Your account'
	})
}

exports.getMyTours = catchAsync(async (req, res, next) => {
	//* 1) Find all bookings
	const bookings = await Bookings.find({ user: req.user.id })

	//* 2) Find tours with the returned IDs
	const tourIds = bookings.map(el => el.tour._id)
	const tours = await Tour.find({ _id: { $in: tourIds } })

	res.status(200).render('overview', {
		title: 'My Tours',
		tours
	})
})

exports.getForgotPasswordForm = (req, res) => {
	res.status(200).render('forgotPassword', {
		title: 'Reset your password'
	})
}

exports.getResetPasswordForm = (req, res) => {
	res.status(200).render('resetPassword', {
		title: 'Choose your new password',
		token: req.params.token
	})
}
