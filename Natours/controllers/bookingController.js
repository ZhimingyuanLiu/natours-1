const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Booking = require('./../models/bookingModel')
const Tour = require('./../models/tourModel')
const factory = require('./handlerFactory')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/AppError')

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
	//* 1) Get the currently booked tour
	const tour = await Tour.findById(req.params.tourId)
	if (!tour) return next(new AppError('There is no tour with that id'), 404)

	//* 2) Create checkout session
	const session = await stripe.checkout.sessions.create({
		// Information about the session
		payment_method_types: ['card'],
		success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${
			tour.price
		}`,
		cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		// Details about the product
		line_items: [
			{
				name: `${tour.name} Tour`,
				description: tour.summary,
				images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
				amount: tour.price * 100,
				currency: 'usd', // 'eur'
				quantity: 1
			}
		]
	})

	//* 3) Create session as response
	res.status(200).json({
		status: 'success',
		session
	})
})

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
	//! This is only TEMPORARY, because its UNSECURE: everyone can make bookings without paying... :o

	//* 1) Get the data from the query
	const { tour, user, price } = req.query

	//* 2) Check if the querystring was defined
	if (!tour || !user || !price) return next()

	//* 3) Create the booking
	await Booking.create({ tour, user, price })

	//* 4) Redirect the user (hide the query)
	res.redirect(req.originalUrl.split('?')[0])
})

exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)
