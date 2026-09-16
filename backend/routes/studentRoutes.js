const express = require('express');
const router  = express.Router();
const studentController = require('../controllers/studentController');
const upload  = require('../middleware/upload');
const { validateFields } = require('../middleware/errorHandler');

// Auth
router.post('/register', validateFields(['name','email','course','password']), studentController.registerStudent);
router.post('/login',    validateFields(['email','password']),                  studentController.loginStudent);

// Profile
router.get('/',           studentController.getAllStudents);
router.get('/:studentId', studentController.getStudent);
router.delete('/:studentId', studentController.deleteStudent);

// Files
router.post(
  '/:studentId/upload',
  (req, res, next) => { req.body.studentId = req.params.studentId; next(); },
  upload.array('files', 30),
  studentController.uploadFiles
);
router.get('/:studentId/files', studentController.getFiles);

module.exports = router;
