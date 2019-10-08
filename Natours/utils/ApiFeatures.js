class APIFeatues {
	constructor(query, queryReq) {
		this.query = query
		this.queryReq = queryReq
	}

	filter() {
		//* Filtering */
		// Make a hard copy of queryReq
		const queryObj = { ...this.queryReq }
		// Define excluded 'properties'
		const excludedFields = ['page', 'sort', 'limit', 'fields']
		// Remove those properties from queryObj
		excludedFields.forEach(el => delete queryObj[el])

		//* Advanced filtering */
		// Convert queryObj into a string to apply string-methods
		let queryStr = JSON.stringify(queryObj)
		// Replace (gte, gt, lte, lt) with ($gte, $gt, $lte, $lt) for query operations
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

		// Create the query object
		this.query = this.query.find(JSON.parse(queryStr))

		//! For function chaining
		return this
	}

	sort() {
		if (this.queryReq.sort) {
			// Before sort: 'price,ratingAverage' after sort: 'price ratingsAverage'
			const sortBy = this.queryReq.sort.split(',').join(' ')
			this.query = this.query.sort(sortBy)
		} else {
			// Default sort
			this.query = this.query.sort('-createdAt')
		}

		//! For function chaining
		return this
	}

	limitFields() {
		if (this.queryReq.fields) {
			// Before sort: 'name,difficulty' after sort: 'name difficulty'
			const fields = this.queryReq.fields.split(',').join(' ')
			this.query = this.query.select(fields)
		} else {
			// Defualt sort
			this.query = this.query.select('-__v')
		}

		//! For function chaining
		return this
	}

	paginate() {
		const page = this.queryReq.page * 1 || 1
		const limit = this.queryReq.limit * 1 || 100
		const skip = limit * (page - 1)

		this.query = this.query.skip(skip).limit(limit)

		//! For function chaining
		return this
	}
}

module.exports = APIFeatues
