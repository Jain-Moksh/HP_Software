const express = require('express');
const router = express.Router();
const sellerReportController = require('../controllers/sellerReportController');

router.get('/:sellerName', sellerReportController.getSellerReport);

module.exports = router;
