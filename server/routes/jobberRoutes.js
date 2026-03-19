const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// GET /api/jobbers - Get distinct jobber names
router.get('/', materialController.getJobbers);

module.exports = router;
