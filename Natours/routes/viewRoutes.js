const express = require('express')
const viewsController = require('./../controllers/viewsController')
const authController = require('./../controllers/authController')

const router = express.Router()

router.use(viewsController.alerts)

router.get('/', authController.isLoggedIn, viewsController.getOverview)
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour)

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)
router.get('/register', authController.isLoggedIn, viewsController.getRegisterForm)

router.get('/me', authController.protect, viewsController.getAccount)
router.get('/my-tours', authController.protect, viewsController.getMyTours)

router.get('/forgotPassword', authController.isLoggedIn, viewsController.getForgotPasswordForm)
router.get('/resetPassword/:token', authController.isLoggedIn, viewsController.getResetPasswordForm)

module.exports = router
