const express = require('express');
const router = express.Router();
const adjustmentController = require('../controllers/adjustmentController');

router.post('/', adjustmentController.createAdjustment);
router.get('/jobber/:jobberId', adjustmentController.getAdjustmentsByJobber);
router.put('/:id', adjustmentController.updateAdjustment);
router.delete('/:id', adjustmentController.deleteAdjustment);

module.exports = router;
