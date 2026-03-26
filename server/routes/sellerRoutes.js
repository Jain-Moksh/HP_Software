const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

router.get('/', sellerController.getSellers);
router.post('/', sellerController.createSeller);
router.delete('/:id', sellerController.deleteSeller);

module.exports = router;
