const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.get('/', vendorController.getVendors);
router.post('/', vendorController.createVendor);

module.exports = router;
