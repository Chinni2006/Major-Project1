const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const { validateFields } = require('../middleware/errorHandler');

// Store a student's skill hash on the blockchain
router.post('/store', validateFields(['studentId']), blockchainController.storeSkillHash);

// Get all blockchain records
router.get('/records', blockchainController.getAllRecords);

// Get a specific student's blockchain record
router.get('/record/:studentId', blockchainController.getRecord);

// Get blockchain network status
router.get('/status', blockchainController.getNetworkStatus);

module.exports = router;
