const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');

router.get('/backup/config', utilityController.getBackupConfig);
router.post('/backup/config', utilityController.saveBackupConfig);
router.get('/backup/download', utilityController.downloadManualBackup);
router.post('/restore', utilityController.restoreBackup);

module.exports = router;
