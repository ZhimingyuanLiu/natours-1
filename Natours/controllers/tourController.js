const Tour = require('./../models/tourModel')
const APIFeatues = require('./../utils/ApiFeatures')
const catchAsync = require('./../utils/catchAsync')
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

exports.getAllTours = catchAsync(async (req, res, next) => {
	//* BUILD QUERY */
	const features = new APIFeatues(Tour.find(), req.query)
		.filter()
		.sort()
		.limitFields()
		.paginate()

	//* EXECUTE QUERY */
	const tours = await features.query

	//* SEND RESPONSE */
	res.status(200).json({
		status: 'Success',
		result: tours.length,
		data: {
			tours
		}
	})
})

exports.getTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findById(req.params.id)

	// If the ID is invalid
	if (!tour) {
		return next(new AppError('No tour found with that ID', 404))
	}

	//* SEND SUCCESS RESPONSE */
	res.status(200).json({
		status: 'success',
		data: {
			tour
		}
	})
})

exports.createTour = catchAsync(async (req, res, next) => {
	const newTour = await Tour.create(req.body)

	//* SEND SUCCESS RESPONSE */
	res.status(201).json({
		status: 'success',
		data: {
			tour: newTour
		}
	})
})

exports.updateTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true
	})

	// If the ID is invalid
	if (!tour) {
		return next(new AppError('No tour found with that ID', 404))
	}

	//* SEND SUCCESS RESPONSE */
	res.status(200).json({
		status: 'success',
		data: {
			tour
		}
	})
})

exports.deleteTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findByIdAndDelete(req.params.id, req.body)

	// If the ID is invalid
	if (!tour) {
		return next(new AppError('No tour found with that ID', 404))
	}

	//* SEND SUCCESS RESPONSE */
	res.status(204).json({
		status: 'success',
		data: null
	})
})

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
