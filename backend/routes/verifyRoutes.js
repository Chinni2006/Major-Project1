const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const { validateFields } = require('../middleware/errorHandler');

// Verify a student's skill profile by student ID
router.post('/student', validateFields(['studentId']), verifyController.verifyByStudentId);

// Verify by hash directly
router.post('/hash', validateFields(['studentId', 'hash']), verifyController.verifyByHash);

// Get verification history (audit trail)
router.get('/history/:studentId', verifyController.getVerificationHistory);

module.exports = router;
