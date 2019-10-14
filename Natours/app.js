const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

const app = express()

//* 1) GLOABAL MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

// 100 request from the same IP in 1 hour
const limiter = rateLimit({
	max: 3,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try again in an hour.'
})
app.use('/api', limiter)

app.use(express.json())

app.use(express.static(`${__dirname}/public`))

app.use((req, res, next) => {
	next()
})

//* 2) ROUTES
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

//* 3) 404-Error
app.all('*', (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

//* 4) ERROR-HANDLER
app.use(globalErrorHandler)

module.exports = app
