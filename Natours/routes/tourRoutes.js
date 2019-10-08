const express = require('express')
const tourController = require('./../controllers/tourController')

const router = express.Router()

//router.param('id', tourController.checkId)

router
	.route('/')
	.get(tourController.getAllTours)
	.post(tourController.createTour)

router.route('/top-5-cheap').get(tourController.aliasTopToursCheap, tourController.getAllTours)
router.route('/top-5-ratingsAverage').get(tourController.aliasTopToursRatingsAverage, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)

router
	.route('/:id')
	.get(tourController.getTour)
	.patch(tourController.updateTour)
	.delete(tourController.deleteTour)

module.exports = router
