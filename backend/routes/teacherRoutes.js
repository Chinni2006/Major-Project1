const express = require('express');
const router  = express.Router();
const tc  = require('../controllers/teacherController');
const qc  = require('../controllers/quizController');
const { requireTeacher } = require('../middleware/authMiddleware');
const { validateFields }  = require('../middleware/errorHandler');

// Auth (public)
router.post('/register', validateFields(['name','email','password']), tc.registerTeacher);
router.post('/login',    validateFields(['email','password']),        tc.loginTeacher);

// Dashboard (protected)
router.get('/dashboard',           requireTeacher, tc.getDashboard);
router.get('/students',            requireTeacher, tc.getStudents);
router.get('/quiz/:quizId/results',requireTeacher, tc.getQuizResults);

// Quiz CRUD (protected)
router.post  ('/quiz',                         requireTeacher, qc.createQuiz);
router.get   ('/quizzes',                      requireTeacher, qc.getTeacherQuizzes);
router.get   ('/quiz/:quizId',                 requireTeacher, qc.getQuiz);
router.put   ('/quiz/:quizId',                 requireTeacher, qc.updateQuiz);
router.delete('/quiz/:quizId',                 requireTeacher, qc.deleteQuiz);
router.post  ('/quiz/:quizId/publish',         requireTeacher, qc.togglePublish);

// Questions (protected)
router.post  ('/quiz/:quizId/question',                    requireTeacher, qc.addQuestion);
router.put   ('/quiz/:quizId/question/:questionId',        requireTeacher, qc.updateQuestion);
router.delete('/quiz/:quizId/question/:questionId',        requireTeacher, qc.deleteQuestion);

module.exports = router;
