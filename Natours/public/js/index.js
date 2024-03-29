/* eslint-disable */
import '@babel/polyfill'
import { displayMap } from './mapbox'
import { login, logout, register, forgotPassword, resetPassword } from './auth'
import { updateSettings } from './updateSettings'
import { bookTour } from './stripe'
import { showAlert } from './alerts'

//* DOM ELEMENTS
const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form--login')
const registerForm = document.querySelector('.form--register')
const logoutButton = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const forgotPasswordForm = document.querySelector('.form--forgotPassword')
const resetPasswordForm = document.querySelector('.form--resetPassword')
const bookBtn = document.getElementById('book-tour')

//* DELEGATION
if (mapBox) {
	const locations = JSON.parse(mapBox.dataset.locations)
	displayMap(locations)
}

if (loginForm) {
	loginForm.addEventListener('submit', e => {
		e.preventDefault()

		const email = document.getElementById('email').value
		const password = document.getElementById('password').value

		login(email, password)
	})
}

if (registerForm) {
	registerForm.addEventListener('submit', e => {
		e.preventDefault()

		const name = document.getElementById('name').value
		const email = document.getElementById('email').value
		const password = document.getElementById('password').value
		const passwordConfirm = document.getElementById('passwordConfirm').value

		register(name, email, password, passwordConfirm)
	})
}

if (logoutButton) logoutButton.addEventListener('click', logout)

if (userDataForm) {
	userDataForm.addEventListener('submit', e => {
		e.preventDefault()

		const form = new FormData()
		form.append('name', document.getElementById('name').value)
		form.append('email', document.getElementById('email').value)
		form.append('photo', document.getElementById('photo').files[0])

		updateSettings(form, 'data')
	})
}

if (userPasswordForm) {
	userPasswordForm.addEventListener('submit', async e => {
		e.preventDefault()
		document.querySelector('.btn--save--password').textContent = 'Updating...'

		const passwordCurrent = document.getElementById('password-current').value
		const password = document.getElementById('password').value
		const passwordConfirm = document.getElementById('password-confirm').value
		await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password')

		// Reset
		document.getElementById('password-current').value = ''
		document.getElementById('password').value = ''
		document.getElementById('password-confirm').value = ''
		document.querySelector('.btn--save--password').textContent = 'Save password'
	})
}

if (forgotPasswordForm) {
	forgotPasswordForm.addEventListener('submit', e => {
		e.preventDefault()

		const email = document.getElementById('email').value

		forgotPassword(email)
	})
}

if (resetPasswordForm) {
	resetPasswordForm.addEventListener('submit', e => {
		e.preventDefault()

		const token = document.getElementById('resetPasswordToken').dataset.token
		const password = document.getElementById('password').value
		const passwordConfirm = document.getElementById('passwordConfirm').value

		resetPassword(token, password, passwordConfirm)
	})
}

if (bookBtn) {
	bookBtn.addEventListener('click', e => {
		e.target.textContent = 'Processing...'

		const { tourId } = e.target.dataset
		bookTour(tourId)
	})
}

const alertMessage = document.querySelector('body').dataset.alert
if (alertMessage) {
	showAlert('success', alertMessage, 11)
}
