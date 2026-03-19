const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// POST /api/material - Add a new record
router.post('/', materialController.addMaterial);

// GET /api/material - Get all records sorted by date
router.get('/', materialController.getMaterials);

module.exports = router;
