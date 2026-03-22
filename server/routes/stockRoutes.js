const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/jobber/:jobberId', stockController.getJobberStock);

module.exports = router;
