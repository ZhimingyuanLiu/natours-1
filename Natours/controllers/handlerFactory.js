const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/AppError')
const APIFeatues = require('./../utils/ApiFeatures')

exports.createOne = Model =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.create(req.body)

		//* SEND SUCCESS RESPONSE */
		res.status(201).json({
			status: 'success',
			data: {
				data: doc
			}
		})
	})

exports.getOne = (Model, popOptions) =>
	catchAsync(async (req, res, next) => {
		let query = Model.findById(req.params.id)
		if (popOptions) query = query.populate(popOptions)

		const doc = await query

		// If the ID is invalid
		if (!doc) {
			return next(new AppError('No document found with that ID', 404))
		}

		//* SEND SUCCESS RESPONSE */
		res.status(200).json({
			status: 'success',
			data: {
				data: doc
			}
		})
	})

exports.getAll = Model =>
	catchAsync(async (req, res, next) => {
		// Allow nested routes (to allow get reviews on tour)
		let filter = {}
		if (req.params.tourId) filter = { tour: req.params.tourId }

		//* BUILD QUERY */
		const features = new APIFeatues(Model.find(filter), req.query)
			.filter()
			.sort()
			.limitFields()
			.paginate()

		//* EXECUTE QUERY */
		const doc = await features.query

		//* SEND RESPONSE */
		res.status(200).json({
			status: 'Success',
			result: doc.length,
			data: {
				data: doc
			}
		})
	})

exports.updateOne = Model =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		})

		// If the ID is invalid
		if (!doc) {
			return next(new AppError('No document found with that ID', 404))
		}

		//* SEND SUCCESS RESPONSE */
		res.status(200).json({
			status: 'success',
			data: {
				data: doc
			}
		})
	})

exports.deleteOne = Model =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id, req.body)

		// If the ID is invalid
		if (!doc) {
			return next(new AppError('No document found with that ID', 404))
		}

		//* SEND SUCCESS RESPONSE */
		res.status(204).json({
			status: 'success',
			data: null
		})
	})
