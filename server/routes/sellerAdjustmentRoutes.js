const express = require('express');
const router = express.Router();
const sellerAdjustmentController = require('../controllers/sellerAdjustmentController');

router.post('/', sellerAdjustmentController.createAdjustment);
router.get('/seller/:sellerId', sellerAdjustmentController.getAdjustmentsBySeller);
router.put('/:id', sellerAdjustmentController.updateAdjustment);
router.delete('/:id', sellerAdjustmentController.deleteAdjustment);

module.exports = router;
