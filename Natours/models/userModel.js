const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please tell us your name!']
	},
	email: {
		type: String,
		required: [true, 'Please provide your email!'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide a valid email!']
	},
	photo: String,
	role: {
		type: String,
		enum: ['user', 'guide', 'lead-guide', 'admin'],
		default: 'user'
	},
	password: {
		type: String,
		required: [true, 'Please provide a password!'],
		minlength: 8,
		select: false
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {
			// This only works on CREATE and SAVE!!!
			validator: function(el) {
				return el === this.password
			},
			message: "Passwords aren't the same"
		}
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	}
})

//* MIDDLEWARES
//? hashing
userSchema.pre('save', async function(next) {
	// Return if the password wasn't modified
	if (!this.isModified('password')) return next()

	// Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password, 12)
	// Delete the passwordConfirm field
	this.passwordConfirm = undefined

	next()
})

//? Setting passwordChangedAt
userSchema.pre('save', function(next) {
	// Return if the password wasn't modified or the document is new (wasn't changed)
	if (!this.isModified('password') || this.isNew) return next()

	// Substracting 1 second because otherwise the token would be invalid?
	this.passwordChangedAt = Date.now() - 1000

	next()
})

//? Filter out inactive accounts
userSchema.pre(/^find/, function(next) {
	// this points to the current query
	this.find({ active: { $ne: false } })
	next()
})

//* METHODS
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
	return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswortAfter = function(JWTTimestamp) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

		return JWTTimestamp < changedTimestamp //! 100 < 200
	}

	//? False means NOT changed
	return false
}

userSchema.methods.createPasswordResetToken = function() {
	const resetToken = crypto.randomBytes(32).toString('hex')

	// Encrypt the reset token and store it to the database (secruity-best-practise)
	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex')

	// Expires in 10 minutes
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000

	return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User
