const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')
const factory = require('./handlerFactory')
const AppError = require('./../utils/AppError')

exports.aliasTopToursCheap = (req, res, next) => {
	req.query.limit = '5'
	req.query.sort = 'price, ratingsAverage'
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
	next()
}

exports.aliasTopToursRatingsAverage = (req, res, next) => {
	req.query.limit = '5'
	req.query.sort = '-ratingsAverage, price'
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
	next()
}

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)

exports.getTourStats = catchAsync(async (req, res, next) => {
	//* BUILD AGGREGATE */
	const stats = await Tour.aggregate([
		{
			$match: { ratingsAverage: { $gte: 4.5 } }
		},
		{
			$group: {
				_id: { $toUpper: '$difficulty' },
				numTours: { $sum: 1 },
				numRatings: { $sum: '$ratingsQuantity' },
				avgRating: { $avg: '$ratingsAverage' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' }
			}
		},
		{
			// Sorts by avgPrice ascending
			$sort: { avgPrice: 1 }
		}
	])

	//* SEND SUCCESS RESPONSE */
	res.status(200).json({
		status: 'success',
		data: {
			stats
		}
	})
})

//? Returns a object containing which tours start at a specific month in a given year
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
	const year = req.params.year * 1

	const plan = await Tour.aggregate([
		{
			// Destructs an array in an object(startDates) and returns a new object for each array-element with the same data (only with different startDates)
			$unwind: '$startDates'
		},
		{
			$match: {
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`)
				}
			}
		},
		{
			$group: {
				_id: { $month: '$startDates' },
				numTourStarts: { $sum: 1 },
				tours: { $push: '$name' }
			}
		},
		{
			// Adds a field
			$addFields: { month: '$_id' }
		},
		{
			// Removes field
			$project: {
				_id: 0
			}
		},
		{
			// Sorts by numTourStart descending
			$sort: { numTourStarts: -1 }
		},
		{
			// Limits the results by 12
			$limit: 12
		}
	])

	//* SEND SUCCESS RESPONSE */
	res.status(200).json({
		status: 'success',
		data: {
			plan
		}
	})
})

exports.getToursWithin = catchAsync(async (req, res, next) => {
	const { distance, latlng, unit } = req.params
	const [lat, lng] = latlng.split(',')
	const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

	if (!lat || !lng) {
		next(new AppError('Please provide latitur and longitude in the format lat,lng', 400))
	}

	const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } })

	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: {
			data: tours
		}
	})
})

exports.getDistances = catchAsync(async (req, res, next) => {
	const { latlng, unit } = req.params
	const [lat, lng] = latlng.split(',')

	const multiplier = unit === 'mi' ? 0.000621371 : 0.001

	if (!lat || !lng) {
		next(new AppError('Please provide latitur and longitude in the format lat,lng', 400))
	}

	const distances = await Tour.aggregate([
		{
			$geoNear: {
				near: {
					type: 'Point',
					coordinates: [lng * 1, lat * 1]
				},
				distanceField: 'distance',
				distanceMultiplier: multiplier
			}
		},
		{
			$project: {
				distance: 1,
				name: 1
			}
		}
	])

	res.status(200).json({
		status: 'success',
		data: {
			data: distances
		}
	})
})
