const express = require('express');
const router = express.Router();
const pollAnalyticsController = require('../controllers/analyticsController');

router.get('/polls/:pollId/analytics', pollAnalyticsController.fetchPollAnalytics);
router.get('/polls/analytics/all', pollAnalyticsController.fetchPollAnalyticsAll);

module.exports=router
