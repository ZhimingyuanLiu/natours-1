/* eslint-disable */
import axios from 'axios'
import { showAlert } from './alerts'

export const bookTour = async tourId => {
	try {
		const stripe = Stripe('pk_test_JswB5B35fmWSi0X7pZO0A8R400PH3HQ5D7')

		//* 1) Get checkout session from api
		const session = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`)
		console.log(session)

		//* 2) Create checkout form + charge credit card
		await stripe.redirectToCheckout({
			sessionId: session.data.session.id
		})
	} catch (err) {
		showAlert('error', err)
	}
}
