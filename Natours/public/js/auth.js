/* eslint-disable */
import axios from 'axios'
import { showAlert } from './alerts'

export const login = async (email, password) => {
	try {
		const res = await axios({
			method: 'POST',
			url: '/api/v1/users/login',
			data: {
				email,
				password
			}
		})

		if (res.data.status === 'success') {
			showAlert('success', 'Logged in successfully!')
			window.setTimeout(() => {
				location.assign('/')
			}, 1500)
		}
	} catch (err) {
		showAlert('error', err.response.data.message)
	}
}

export const logout = async () => {
	try {
		const res = await axios({
			method: 'GET',
			url: '/api/v1/users/logout'
		})

		if (res.data.status === 'success') {
			showAlert('success', 'Logged out successfully!')
			window.setTimeout(() => {
				location.assign('/')
			}, 1500)
		}
	} catch (err) {
		showAlert('error', 'Error logging up. Please try it again later!')
	}
}

export const register = async (name, email, password, passwordConfirm) => {
	try {
		const res = await axios({
			method: 'POST',
			url: '/api/v1/users/signup',
			data: {
				name,
				email,
				password,
				passwordConfirm
			}
		})

		if (res.data.status === 'success') {
			showAlert('success', 'Signed up successfully!')
			window.setTimeout(() => {
				location.assign('/')
			}, 1500)
		}
	} catch (err) {
		showAlert('error', err.response.data.message)
	}
}

export const forgotPassword = async email => {
	try {
		const res = await axios({
			method: 'POST',
			url: '/api/v1/users/forgotPassword',
			data: {
				email
			}
		})

		if (res.data.status === 'success') {
			showAlert('success', 'Email sent!')
			window.setTimeout(() => {
				location.assign('/')
			}, 1500)
		}
	} catch (err) {
		showAlert('error', err.response.data.message)
	}
}

export const resetPassword = async (token, password, passwordConfirm) => {
	try {
		const res = await axios({
			method: 'PATCH',
			url: `/api/v1/users/resetPassword/${token}`,
			data: {
				password,
				passwordConfirm
			}
		})

		if (res.data.status === 'success') {
			showAlert('success', 'You resetted your password successfully!')
			window.setTimeout(() => {
				location.assign('/login')
			}, 1500)
		}
	} catch (err) {
		showAlert('error', err.response.data.message)
	}
}
