const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/in', transactionController.getAllTransactionsIn);
router.get('/out', transactionController.getAllTransactionsOut);

router.post('/in', transactionController.createTransactionIn);
router.put('/in/:id', transactionController.updateTransactionIn);
router.delete('/in/:id', transactionController.deleteTransactionIn);

router.post('/out', transactionController.createTransactionOut);
router.put('/out/:id', transactionController.updateTransactionOut);
router.delete('/out/:id', transactionController.deleteTransactionOut);

router.get('/in/:jobberId', transactionController.getInTransactionsByJobber);
router.get('/out/:jobberId', transactionController.getOutTransactionsByJobber);

router.get('/seller/:sellerId', transactionController.getTransactionsBySeller);
router.get('/vendor/:vendorId', transactionController.getTransactionsByVendor);

module.exports = router;
