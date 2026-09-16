const express = require('express');
const router  = express.Router();
const qc  = require('../controllers/quizController');
const ac  = require('../controllers/attemptController');
const { requireStudent } = require('../middleware/authMiddleware');

// Student: get available quizzes
router.get('/available',                          requireStudent, qc.getAvailableQuizzes);

// Attempt lifecycle
router.post  ('/attempt/:quizId/start',           requireStudent, ac.startAttempt);
router.post  ('/attempt/:attemptId/answer',       requireStudent, ac.saveAnswer);
router.post  ('/attempt/:attemptId/violation',    requireStudent, ac.logViolation);
router.post  ('/attempt/:attemptId/submit',       requireStudent, ac.submitAttempt);
router.get   ('/attempt/:attemptId/result',       requireStudent, ac.getAttemptResult);
router.get   ('/my-attempts',                     requireStudent, ac.getMyAttempts);

module.exports = router;
