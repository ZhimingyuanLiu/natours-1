const express = require('express')
const bookingController = require('../controllers/bookingController')
const authController = require('../controllers/authController')

const router = express.Router()

//* Everything below is protected */
router.use(authController.protect)

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession)

router
	.route('/')
	.get(authController.restrictTo('admin', 'lead-guide'), bookingController.getAllBookings)
	.post(authController.restrictTo('admin'), bookingController.createBooking)

router
	.route('/:id')
	.get(authController.restrictTo('admin', 'lead-guide'), bookingController.getBooking)
	.patch(authController.restrictTo('admin'), bookingController.updateBooking)
	.delete(authController.restrictTo('admin'), bookingController.deleteBooking)

module.exports = router
