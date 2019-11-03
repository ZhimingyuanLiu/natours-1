const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Booking = require('./../models/bookingModel')
const Tour = require('./../models/tourModel')
const User = require('./../models/userModel')
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
		// success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${
		// 	tour.price
		// }`,
		success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
		cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		// Details about the product
		line_items: [
			{
				name: `${tour.name} Tour`,
				description: tour.summary,
				images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
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

// // exports.createBookingCheckout = catchAsync(async (req, res, next) => {
// // 	//! This is only TEMPORARY, because its UNSECURE: everyone can make bookings without paying... :o

// // 	//* 1) Get the data from the query
// // 	const { tour, user, price } = req.query

// // 	//* 2) Check if the querystring was defined
// // 	if (!tour || !user || !price) return next()

// // 	//* 3) Create the booking
// // 	await Booking.create({ tour, user, price })

// // 	//* 4) Redirect the user (hide the query)
// // 	res.redirect(req.originalUrl.split('?')[0])
// // })

const createBookingCheckout = async session => {
	//* 1) Receive session data
	const tour = session.client_reference_id
	const user = (await User.findOne({ email: session.customer_email })).id
	const price = session.display_items[0].amount / 100

	//* 2) Create booking
	await Booking.create({ tour, user, price })
}

exports.webhookCheckout = (req, res, next) => {
	//* 1) Receive unique signature
	const signature = req.headers['stripe-signature']

	//* 2) Create event
	let event
	try {
		event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
	} catch (err) {
		return res.status(400).send(`Webhook error: ${err.message}`)
	}

	//* 3) If we receive the event we wanted
	if (event.type === 'checkout.session.completed') {
		createBookingCheckout(event.data.object)
	}

	res.status(200).json({ received: true })
}

exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)
