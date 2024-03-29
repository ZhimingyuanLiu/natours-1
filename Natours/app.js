const path = require('path')
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const compression = require('compression')
const cors = require('cors')

const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const bookingController = require('./controllers/bookingController')

const app = express()

// Heroku uses proxies
app.enable('trust proxy')

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

//* 1) GLOABAL MIDDLEWARES
// Implement CORS
app.use(cors()) // Sets Access-Control-Allow-Origin to *
app.options('*', cors()) // For complex requests (path delete etc.)

// Serving static files
app.use(express.static(path.join(__dirname, 'public')))

// Set security HTTP headers
app.use(helmet())

// Development logging
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

// 100 request from the same IP in 1 hour (only API)
const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try again in an hour.'
})
app.use('/api', limiter)

// Can't deal with json-data, that's why we have to put this route before we parse the body
app.post('/webhook-checkout', express.raw({ type: 'application/json' }), bookingController.webhookCheckout)

// Body parser, reading data drom body into req.body
app.use(express.json({ limit: '10kb' }))
// app.use(express.urlencoded({ extended: true, limit: '10kb' })) // only needed form-submit (with action and method)
app.use(cookieParser())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xss())

// Prevent parameter pollution
app.use(
	hpp({
		whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
	})
)

// Compresses text in responses
app.use(compression())

// "Test" middleware
app.use((req, res, next) => {
	next()
})

//* 2) MOUNTING ROUTERS

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

//* 3) 404-Error
app.all('*', (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

//* 4) ERROR-HANDLER
app.use(globalErrorHandler)

module.exports = app
