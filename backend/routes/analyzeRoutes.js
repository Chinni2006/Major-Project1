const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const { validateFields } = require('../middleware/errorHandler');

// Analyze uploaded files for a student and generate Skill DNA
router.post('/student/:studentId', analyzeController.analyzeStudent);

// Re-analyze with updated files
router.put('/student/:studentId', analyzeController.analyzeStudent);

// Get existing analysis result for a student
router.get('/student/:studentId', analyzeController.getAnalysis);

// Analyze a single code snippet (for demo/testing)
router.post('/snippet', validateFields(['code', 'language']), analyzeController.analyzeSnippet);

module.exports = router;
