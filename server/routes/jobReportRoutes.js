const express = require('express');
const router = express.Router();
const jobReportController = require('../controllers/jobReportController');

// GET /api/job-report/:jobber - Get job report for a specific jobber
router.get('/:jobber', jobReportController.getJobReport);

module.exports = router;
