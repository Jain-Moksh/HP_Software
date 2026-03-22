const express = require('express');
const router = express.Router();
const jobberController = require('../controllers/jobberController');

router.get('/', jobberController.getJobbers);
router.post('/', jobberController.createJobber);

module.exports = router;
